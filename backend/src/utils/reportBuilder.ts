import { AIReportContent } from './aiHelper';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonthName = (month: number) => MONTH_NAMES[month - 1] || 'Unknown';

export interface ReportAnalytics {
  spendingSummary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
  };
  categoryAnalysis: Record<string, number>;
  bankAnalysis: Record<string, { inflow: number; outflow: number; net: number }>;
  UPIAnalysis: Record<string, { transactions: number; totalSpent: number }>;
  loanAnalysis: {
    activeLoans: number;
    totalEmi: number;
    totalRemaining: number;
    emiBurdenPercent: number;
    loans: Array<{ name: string; emi: number; remaining: number; bank: string }>;
  };
  insuranceAnalysis: {
    activePolicies: number;
    totalCoverage: number;
    monthlyPremium: number;
    policies: Array<{ name: string; provider: string; premium: number }>;
  };
  investmentAnalysis: {
    totalInvested: number;
    currentValue: number;
    profitLoss: number;
    profitPercent: number;
    holdings: number;
  };
  subscriptionsAnalysis: {
    activeCount: number;
    monthlyCost: number;
    wastedAmount: number;
    lowUsageCount: number;
    services: Array<{ name: string; cost: number; usage: string }>;
  };
}

export function filterTransactionsByMonth(transactions: any[], month: number, year: number) {
  return transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

export function buildReportAnalytics(month: number, year: number, data: any): ReportAnalytics {
  const monthlyTx = filterTransactionsByMonth(data.transactions || [], month, year);
  const expenses = monthlyTx.filter((t: any) => t.type === 'expense');
  const incomes = monthlyTx.filter((t: any) => t.type === 'income');

  const totalIncome = incomes.reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s: number, t: any) => s + t.amount, 0);
  const netSavings = Math.max(0, totalIncome - totalExpense);

  const categoryAnalysis: Record<string, number> = {};
  expenses.forEach((t: any) => {
    categoryAnalysis[t.category] = (categoryAnalysis[t.category] || 0) + t.amount;
  });

  const bankAnalysis: Record<string, { inflow: number; outflow: number; net: number }> = {};
  monthlyTx.forEach((t: any) => {
    const bank = t.bankName || 'Unknown';
    if (!bankAnalysis[bank]) bankAnalysis[bank] = { inflow: 0, outflow: 0, net: 0 };
    if (t.type === 'income') bankAnalysis[bank].inflow += t.amount;
    else bankAnalysis[bank].outflow += t.amount;
    bankAnalysis[bank].net = bankAnalysis[bank].inflow - bankAnalysis[bank].outflow;
  });

  const UPIAnalysis: Record<string, { transactions: number; totalSpent: number }> = {};
  expenses.filter((t: any) => t.paymentMode === 'UPI').forEach((t: any) => {
    const upi = t.upiId || 'Unknown UPI';
    if (!UPIAnalysis[upi]) UPIAnalysis[upi] = { transactions: 0, totalSpent: 0 };
    UPIAnalysis[upi].transactions += 1;
    UPIAnalysis[upi].totalSpent += t.amount;
  });

  const activeLoans = (data.loans || []).filter((l: any) => l.status === 'active');
  const totalEmi = activeLoans.reduce((s: number, l: any) => s + l.emiAmount, 0);
  const totalRemaining = activeLoans.reduce((s: number, l: any) => s + l.remainingAmount, 0);

  const activeInsurance = (data.insurance || []).filter((i: any) => i.status === 'active');
  const totalCoverage = activeInsurance.reduce((s: number, i: any) => s + i.coverageAmount, 0);
  const monthlyPremium = activeInsurance.reduce((s: number, i: any) => {
    if (i.paymentInterval === 'Monthly') return s + i.premiumAmount;
    if (i.paymentInterval === 'Quarterly') return s + i.premiumAmount / 3;
    return s + i.premiumAmount / 12;
  }, 0);

  const investments = data.investments || [];
  const totalInvested = investments.reduce((s: number, i: any) => s + i.buyPrice * i.quantity, 0);
  const currentValue = investments.reduce((s: number, i: any) => s + i.currentPrice * i.quantity, 0);
  const profitLoss = currentValue - totalInvested;

  const activeSubs = (data.subscriptions || []).filter((s: any) => s.status === 'active');
  const monthlyCost = activeSubs.reduce((s: number, sub: any) => s + sub.cost, 0);
  const lowUsage = activeSubs.filter((s: any) => s.usageFrequency === 'low');
  const wastedAmount = lowUsage.reduce((s: number, sub: any) => s + sub.cost, 0);

  return {
    spendingSummary: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0,
      transactionCount: monthlyTx.length
    },
    categoryAnalysis,
    bankAnalysis,
    UPIAnalysis,
    loanAnalysis: {
      activeLoans: activeLoans.length,
      totalEmi,
      totalRemaining,
      emiBurdenPercent: totalIncome > 0 ? Math.round((totalEmi / totalIncome) * 100) : 0,
      loans: activeLoans.map((l: any) => ({
        name: l.loanName,
        emi: l.emiAmount,
        remaining: l.remainingAmount,
        bank: l.bankName
      }))
    },
    insuranceAnalysis: {
      activePolicies: activeInsurance.length,
      totalCoverage,
      monthlyPremium: Math.round(monthlyPremium),
      policies: activeInsurance.map((i: any) => ({
        name: i.policyName,
        provider: i.provider,
        premium: i.premiumAmount
      }))
    },
    investmentAnalysis: {
      totalInvested,
      currentValue,
      profitLoss,
      profitPercent: totalInvested > 0 ? Math.round((profitLoss / totalInvested) * 1000) / 10 : 0,
      holdings: investments.length
    },
    subscriptionsAnalysis: {
      activeCount: activeSubs.length,
      monthlyCost,
      wastedAmount,
      lowUsageCount: lowUsage.length,
      services: activeSubs.map((s: any) => ({
        name: s.name,
        cost: s.cost,
        usage: s.usageFrequency
      }))
    }
  };
}

export function buildChartData(month: number, year: number, data: any, analytics: ReportAnalytics) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const timeline = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const mNum = d.getMonth() + 1;
    const yNum = d.getFullYear();
    const mTx = filterTransactionsByMonth(data.transactions || [], mNum, yNum);
    const income = mTx.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = mTx.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    timeline.push({
      name: `${months[d.getMonth()]} ${yNum}`,
      income,
      expense,
      savings: Math.max(0, income - expense)
    });
  }

  const categoryChart = Object.entries(analytics.categoryAnalysis).map(([category, amount]) => ({
    category,
    amount
  }));

  const bankChart = Object.entries(analytics.bankAnalysis).map(([bank, vals]) => ({
    bank,
    inflow: vals.inflow,
    outflow: vals.outflow
  }));

  return {
    timeline,
    categoryChart,
    bankChart,
    healthTrend: timeline.map(t => ({
      month: t.name,
      score: t.income > 0 ? Math.min(100, Math.round((t.savings / t.income) * 100) + 50) : 50
    }))
  };
}

export function computeFinancialHealthScore(analytics: ReportAnalytics, aiContent: AIReportContent): number {
  let score = 70;
  const { savingsRate } = analytics.spendingSummary;
  if (savingsRate >= 30) score += 15;
  else if (savingsRate >= 15) score += 8;
  else if (savingsRate < 5) score -= 10;

  if (analytics.loanAnalysis.emiBurdenPercent > 40) score -= 15;
  else if (analytics.loanAnalysis.emiBurdenPercent > 25) score -= 5;
  else score += 5;

  if (analytics.subscriptionsAnalysis.wastedAmount > 500) score -= 5;
  if (analytics.investmentAnalysis.profitPercent > 0) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function buildStoredReport(
  month: number,
  year: number,
  data: any,
  aiContent: AIReportContent,
  predictionData?: any
) {
  const analytics = buildReportAnalytics(month, year, data);
  const chartData = buildChartData(month, year, data, analytics);
  const financialHealthScore = computeFinancialHealthScore(analytics, aiContent);

  return {
    reportMonth: `${getMonthName(month)} ${year}`,
    month,
    year,
    generatedAt: new Date(),
    status: 'Generated' as const,
    financialHealthScore,
    reportData: {
      spendingSummary: analytics.spendingSummary,
      categoryAnalysis: analytics.categoryAnalysis,
      bankAnalysis: analytics.bankAnalysis,
      UPIAnalysis: analytics.UPIAnalysis,
      loanAnalysis: analytics.loanAnalysis,
      insuranceAnalysis: analytics.insuranceAnalysis,
      investmentAnalysis: analytics.investmentAnalysis,
      subscriptionsAnalysis: analytics.subscriptionsAnalysis,
      futurePredictions: aiContent.futurePredictions,
      financialSummary: aiContent.financialSummary,
      highestSpendingCategory: aiContent.highestSpendingCategory,
      savingsAmount: aiContent.savingsAmount,
      overspendingWarnings: aiContent.overspendingWarnings,
      emiBurdenPercentage: aiContent.emiBurdenPercentage,
      subscriptionWasteAmount: aiContent.subscriptionWasteAmount,
      suggestions: aiContent.suggestions
    },
    chartData,
    predictionData: predictionData || null,
    spendingAnalysis: analytics.categoryAnalysis,
    highestSpendingCategory: aiContent.highestSpendingCategory,
    savingsAmount: aiContent.savingsAmount,
    overspendingWarnings: aiContent.overspendingWarnings,
    emiBurdenPercentage: aiContent.emiBurdenPercentage,
    subscriptionWasteAmount: aiContent.subscriptionWasteAmount,
    futurePredictions: aiContent.futurePredictions,
    financialSummary: aiContent.financialSummary,
    suggestions: aiContent.suggestions
  };
}

export function formatReportForClient(doc: any) {
  const id = doc._id?.toString() || doc.id;
  const rd = doc.reportData || {};
  const spending = rd.spendingSummary || {
    totalExpense: doc.savingsAmount != null ? 0 : 0,
    totalIncome: 0,
    netSavings: doc.savingsAmount || 0
  };

  return {
    id,
    userId: doc.userId?.toString?.() || doc.userId,
    month: doc.month,
    year: doc.year,
    reportMonth: doc.reportMonth || `${getMonthName(doc.month)} ${doc.year}`,
    generatedAt: doc.generatedAt || doc.createdAt,
    generatedDate: doc.generatedAt || doc.createdAt,
    status: doc.status || 'Generated',
    financialHealthScore: doc.financialHealthScore || 0,
    pdfUrl: doc.pdfUrl || null,
    spendingSummary: rd.spendingSummary || spending,
    categoryAnalysis: rd.categoryAnalysis || Object.fromEntries(doc.spendingAnalysis || []),
    bankAnalysis: rd.bankAnalysis || {},
    UPIAnalysis: rd.UPIAnalysis || {},
    loanAnalysis: rd.loanAnalysis || {},
    insuranceAnalysis: rd.insuranceAnalysis || {},
    investmentAnalysis: rd.investmentAnalysis || {},
    subscriptionsAnalysis: rd.subscriptionsAnalysis || {},
    futurePredictions: rd.futurePredictions || Object.fromEntries(doc.futurePredictions || []),
    chartData: doc.chartData || {},
    predictionData: doc.predictionData || null,
    financialSummary: rd.financialSummary || doc.financialSummary || '',
    highestSpendingCategory: rd.highestSpendingCategory || doc.highestSpendingCategory || '',
    savingsAmount: rd.savingsAmount ?? doc.savingsAmount ?? 0,
    overspendingWarnings: rd.overspendingWarnings || doc.overspendingWarnings || [],
    emiBurdenPercentage: rd.emiBurdenPercentage ?? doc.emiBurdenPercentage ?? 0,
    subscriptionWasteAmount: rd.subscriptionWasteAmount ?? doc.subscriptionWasteAmount ?? 0,
    suggestions: rd.suggestions || doc.suggestions || [],
    totalSpend: spending.totalExpense || 0
  };
}

export function buildComparison(current: any, previous: any) {
  const curSpend = current.spendingSummary?.totalExpense || current.totalSpend || 0;
  const prevSpend = previous.spendingSummary?.totalExpense || previous.totalSpend || 0;
  const curSavings = current.spendingSummary?.netSavings || current.savingsAmount || 0;
  const prevSavings = previous.spendingSummary?.netSavings || previous.savingsAmount || 0;
  const curInvest = current.investmentAnalysis?.profitPercent || 0;
  const prevInvest = previous.investmentAnalysis?.profitPercent || 0;
  const curEmi = current.loanAnalysis?.totalEmi || 0;
  const prevEmi = previous.loanAnalysis?.totalEmi || 0;
  const curLoanRem = current.loanAnalysis?.totalRemaining || 0;
  const prevLoanRem = previous.loanAnalysis?.totalRemaining || 0;

  const pctChange = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 1000) / 10;

  return {
    spendingChange: pctChange(curSpend, prevSpend),
    savingsChange: pctChange(curSavings, prevSavings),
    investmentGrowth: curInvest - prevInvest,
    loanReduction: prevLoanRem > 0 ? Math.round(((prevLoanRem - curLoanRem) / prevLoanRem) * 1000) / 10 : 0,
    emiChange: curEmi - prevEmi,
    current: { spend: curSpend, savings: curSavings, healthScore: current.financialHealthScore },
    previous: { spend: prevSpend, savings: prevSavings, healthScore: previous.financialHealthScore },
    chartData: [
      { metric: 'Spending', current: curSpend, previous: prevSpend },
      { metric: 'Savings', current: curSavings, previous: prevSavings },
      { metric: 'Health Score', current: current.financialHealthScore || 0, previous: previous.financialHealthScore || 0 }
    ]
  };
}
