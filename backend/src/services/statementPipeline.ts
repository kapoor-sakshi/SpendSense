import mongoose from 'mongoose';
import { generateAIReport, generateAIPrediction } from '../utils/aiHelper';
import { buildStoredReport } from '../utils/reportBuilder';
import Report from '../models/Report';
import User from '../models/User';
import BankAccount from '../models/BankAccount';
import UpiAccount from '../models/UpiAccount';
import Transaction from '../models/Transaction';
import Loan from '../models/Loan';
import Insurance from '../models/Insurance';
import Investment from '../models/Investment';
import Subscription from '../models/Subscription';
import Notification from '../models/Notification';
import Bill from '../models/Bill';
import { getUserDBState } from '../utils/mockDB';
import { shouldUseMongoStore } from '../utils/dbMode';

export const BANK_STATEMENT_UPLOADED = 'BANK_STATEMENT_UPLOADED';

async function fetchUserDataState(userId: string) {
  if (shouldUseMongoStore(userId)) {
    const user = await User.findById(userId);
    const banks = await BankAccount.find({ userId });
    const upiIds = await UpiAccount.find({ userId });
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    const loans = await Loan.find({ userId });
    const insurance = await Insurance.find({ userId });
    const investments = await Investment.find({ userId });
    const subscriptions = await Subscription.find({ userId });
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const bills = await Bill.find({ userId }).sort({ createdAt: -1 });
    return {
      user: {
        id: user?._id?.toString() || userId,
        name: user?.name || 'User',
        email: user?.email || '',
        creditScore: user?.creditScore || 750,
        banks: banks.map(b => ({
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          balance: b.balance,
          accountType: b.accountType
        })),
        linkedUpiIds: upiIds.map(u => u.upiId)
      },
      banks, upiIds, transactions, loans, insurance, investments, subscriptions, notifications, bills
    };
  }
  return getUserDBState(userId);
}

export async function generateFinancialAnalysis(userId: string) {
  const userState = await fetchUserDataState(userId);
  const now = new Date();
  return generateAIReport(now.getMonth() + 1, now.getFullYear(), userState);
}

export async function generateMonthlyReport(userId: string) {
  const userState = await fetchUserDataState(userId);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const aiContent = await generateAIReport(month, year, userState);
  const predictionData = await generateAIPrediction(userState);
  const stored = buildStoredReport(month, year, userState, aiContent, predictionData);

  if (shouldUseMongoStore(userId)) {
    await Report.findOneAndUpdate(
      { userId, month, year },
      {
        userId,
        month,
        year,
        reportMonth: stored.reportMonth,
        generatedAt: stored.generatedAt,
        status: stored.status,
        financialHealthScore: stored.financialHealthScore,
        reportData: stored.reportData,
        chartData: stored.chartData,
        predictionData: stored.predictionData,
        spendingAnalysis: stored.spendingAnalysis,
        highestSpendingCategory: stored.highestSpendingCategory,
        savingsAmount: stored.savingsAmount,
        overspendingWarnings: stored.overspendingWarnings,
        emiBurdenPercentage: stored.emiBurdenPercentage,
        subscriptionWasteAmount: stored.subscriptionWasteAmount,
        futurePredictions: stored.futurePredictions,
        financialSummary: stored.financialSummary,
        suggestions: stored.suggestions
      },
      { upsert: true, new: true }
    );
  }
  return stored;
}

export async function generatePredictions(userId: string) {
  const userState = await fetchUserDataState(userId);
  return generateAIPrediction(userState);
}

export async function updateDashboard(userId: string) {
  const userState = await fetchUserDataState(userId);
  return {
    transactionCount: userState.transactions?.length || 0,
    bankCount: userState.banks?.length || userState.user?.banks?.length || 0,
    refreshedAt: new Date().toISOString()
  };
}

export async function handleBankStatementUploaded(userId: string) {
  const [analysis, report, predictions, dashboard] = await Promise.allSettled([
    generateFinancialAnalysis(userId),
    generateMonthlyReport(userId),
    generatePredictions(userId),
    updateDashboard(userId)
  ]);
  return {
    event: BANK_STATEMENT_UPLOADED,
    analysis: analysis.status === 'fulfilled' ? 'ok' : 'failed',
    report: report.status === 'fulfilled' ? 'ok' : 'failed',
    predictions: predictions.status === 'fulfilled' ? 'ok' : 'failed',
    dashboard: dashboard.status === 'fulfilled' ? dashboard.value : null
  };
}
