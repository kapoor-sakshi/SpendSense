import { StoredReport, MONTH_NAMES } from './reportTypes';
import { Transaction, Loan, Insurance, Investment, Subscription } from './mockData';

const getMonthName = (m: number) => MONTH_NAMES[m - 1] || 'Unknown';

function filterByMonth(transactions: Transaction[], month: number, year: number) {
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

export function buildOfflineStoredReport(
  month: number,
  year: number,
  transactions: Transaction[],
  loans: Loan[],
  insurance: Insurance[],
  investments: Investment[],
  subscriptions: Subscription[],
  aiContent: {
    financialSummary: string;
    highestSpendingCategory: string;
    savingsAmount: number;
    overspendingWarnings: string[];
    emiBurdenPercentage: number;
    subscriptionWasteAmount: number;
    futurePredictions: Record<string, number>;
    suggestions: string[];
  },
  userId?: string
): StoredReport {
  const monthlyTx = filterByMonth(transactions, month, year);
  const expenses = monthlyTx.filter(t => t.type === 'expense');
  const incomes = monthlyTx.filter(t => t.type === 'income');
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

  const categoryAnalysis: Record<string, number> = {};
  expenses.forEach(t => {
    categoryAnalysis[t.category] = (categoryAnalysis[t.category] || 0) + t.amount;
  });

  const bankAnalysis: Record<string, { inflow: number; outflow: number; net: number }> = {};
  monthlyTx.forEach(t => {
    const bank = t.bankName || 'Unknown';
    if (!bankAnalysis[bank]) bankAnalysis[bank] = { inflow: 0, outflow: 0, net: 0 };
    if (t.type === 'income') bankAnalysis[bank].inflow += t.amount;
    else bankAnalysis[bank].outflow += t.amount;
    bankAnalysis[bank].net = bankAnalysis[bank].inflow - bankAnalysis[bank].outflow;
  });

  const UPIAnalysis: Record<string, { transactions: number; totalSpent: number }> = {};
  expenses.filter(t => t.paymentMode === 'UPI').forEach(t => {
    const upi = t.upiId || 'Unknown';
    if (!UPIAnalysis[upi]) UPIAnalysis[upi] = { transactions: 0, totalSpent: 0 };
    UPIAnalysis[upi].transactions += 1;
    UPIAnalysis[upi].totalSpent += t.amount;
  });

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalEmi = activeLoans.reduce((s, l) => s + l.emiAmount, 0);
  const activeInsurance = insurance.filter(i => i.status === 'active');
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalInvested = investments.reduce((s, i) => s + i.buyPrice * i.quantity, 0);
  const currentValue = investments.reduce((s, i) => s + i.currentPrice * i.quantity, 0);

  const savingsRate = totalIncome > 0 ? Math.round((aiContent.savingsAmount / totalIncome) * 100) : 0;
  let healthScore = 70;
  if (savingsRate >= 30) healthScore += 15;
  else if (savingsRate >= 15) healthScore += 8;
  if (aiContent.emiBurdenPercentage > 40) healthScore -= 15;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const timeline = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const mTx = filterByMonth(transactions, d.getMonth() + 1, d.getFullYear());
    const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    timeline.push({ name: `${months[d.getMonth()]} ${d.getFullYear()}`, income: inc, expense: exp, savings: Math.max(0, inc - exp) });
  }

  const id = `rpt_local_${year}_${month}_${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id,
    userId,
    month,
    year,
    reportMonth: `${getMonthName(month)} ${year}`,
    generatedAt: now,
    status: 'Generated',
    financialHealthScore: Math.max(0, Math.min(100, healthScore)),
    spendingSummary: {
      totalIncome,
      totalExpense,
      netSavings: aiContent.savingsAmount,
      savingsRate,
      transactionCount: monthlyTx.length
    },
    categoryAnalysis,
    bankAnalysis,
    UPIAnalysis,
    loanAnalysis: {
      activeLoans: activeLoans.length,
      totalEmi,
      totalRemaining: activeLoans.reduce((s, l) => s + l.remainingAmount, 0),
      emiBurdenPercent: aiContent.emiBurdenPercentage,
      loans: activeLoans.map(l => ({ name: l.loanName, emi: l.emiAmount, remaining: l.remainingAmount, bank: l.bankName }))
    },
    insuranceAnalysis: {
      activePolicies: activeInsurance.length,
      totalCoverage: activeInsurance.reduce((s, i) => s + i.coverageAmount, 0),
      monthlyPremium: activeInsurance.reduce((s, i) => s + i.premiumAmount, 0),
      policies: activeInsurance.map(i => ({ name: i.policyName, provider: i.provider, premium: i.premiumAmount }))
    },
    investmentAnalysis: {
      totalInvested,
      currentValue,
      profitLoss: currentValue - totalInvested,
      profitPercent: totalInvested > 0 ? Math.round(((currentValue - totalInvested) / totalInvested) * 1000) / 10 : 0,
      holdings: investments.length
    },
    subscriptionsAnalysis: {
      activeCount: activeSubs.length,
      monthlyCost: activeSubs.reduce((s, sub) => s + sub.cost, 0),
      wastedAmount: aiContent.subscriptionWasteAmount,
      lowUsageCount: activeSubs.filter(s => s.usageFrequency === 'low').length,
      services: activeSubs.map(s => ({ name: s.name, cost: s.cost, usage: s.usageFrequency }))
    },
    futurePredictions: aiContent.futurePredictions,
    chartData: {
      timeline,
      categoryChart: Object.entries(categoryAnalysis).map(([category, amount]) => ({ category, amount })),
      healthTrend: timeline.map(t => ({
        month: t.name,
        score: t.income > 0 ? Math.min(100, Math.round((t.savings / t.income) * 100) + 50) : 50
      }))
    },
    financialSummary: aiContent.financialSummary,
    highestSpendingCategory: aiContent.highestSpendingCategory,
    savingsAmount: aiContent.savingsAmount,
    overspendingWarnings: aiContent.overspendingWarnings,
    emiBurdenPercentage: aiContent.emiBurdenPercentage,
    subscriptionWasteAmount: aiContent.subscriptionWasteAmount,
    suggestions: aiContent.suggestions,
    totalSpend: totalExpense
  };
}

export function getLocalReports(userId: string): StoredReport[] {
  try {
    const raw = localStorage.getItem(`spendsense_reports_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalReport(userId: string, report: StoredReport) {
  const reports = getLocalReports(userId);
  const idx = reports.findIndex(r => r.month === report.month && r.year === report.year);
  if (idx >= 0) reports[idx] = report;
  else reports.push(report);
  localStorage.setItem(`spendsense_reports_${userId}`, JSON.stringify(reports));
}

export function buildLocalReportStats(
  reports: StoredReport[],
  banks: number,
  upis: number,
  bills: number,
  activeLoans: number,
  txCount: number
) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const sorted = [...reports].sort((a, b) => b.year - a.year || b.month - a.month);
  const lastReport = sorted[0] || null;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const currentReport = reports.find(r => r.month === currentMonth && r.year === currentYear);

  return {
    currentAnalysisMonth: `${getMonthName(currentMonth)} ${currentYear}`,
    currentMonth,
    currentYear,
    currentStatus: (currentReport?.status || (txCount >= 3 ? 'Collecting Data' : 'Pending')) as StoredReport['status'],
    lastGeneratedReport: lastReport ? {
      reportMonth: lastReport.reportMonth,
      generatedAt: lastReport.generatedAt,
      totalSpend: lastReport.totalSpend || lastReport.spendingSummary?.totalExpense || 0,
      financialHealthScore: lastReport.financialHealthScore
    } : null,
    nextReportDate: `${lastDay} ${getMonthName(currentMonth)} ${currentYear}`,
    reportHistoryCount: reports.length,
    healthTrend: sorted.slice(0, 6).reverse().map(r => ({
      month: r.reportMonth,
      score: r.financialHealthScore
    })),
    dataSources: { bankAccounts: banks, upiAccounts: upis, billsUploaded: bills, activeLoans }
  };
}

export function buildLocalTimeline(reports: StoredReport[], year: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const timeline = [];

  for (let m = 1; m <= 12; m++) {
    const saved = reports.find(r => r.month === m && r.year === year);
    let status: string;
    if (saved) status = 'Generated';
    else if (year < currentYear || (year === currentYear && m < currentMonth)) status = 'Pending';
    else if (year === currentYear && m === currentMonth) status = 'In Progress';
    else status = 'Pending';

    timeline.push({
      month: m,
      year,
      reportMonth: `${getMonthName(m)} ${year}`,
      status,
      reportId: saved?.id || null,
      generatedAt: saved?.generatedAt || null,
      totalSpend: saved?.totalSpend || saved?.spendingSummary?.totalExpense || null
    });
  }
  return timeline;
}
