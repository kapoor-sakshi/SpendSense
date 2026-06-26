export type ReportStatus = 'Pending' | 'Collecting Data' | 'Analyzing' | 'Generated' | 'In Progress';

export interface SpendingSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
}

export interface StoredReport {
  id?: string;
  userId?: string;
  month: number;
  year: number;
  reportMonth: string;
  generatedAt: string;
  generatedDate?: string;
  status: ReportStatus;
  financialHealthScore: number;
  pdfUrl?: string | null;
  spendingSummary: SpendingSummary;
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
  futurePredictions: Record<string, number>;
  chartData: {
    timeline?: Array<{ name: string; income: number; expense: number; savings: number }>;
    categoryChart?: Array<{ category: string; amount: number }>;
    bankChart?: Array<{ bank: string; inflow: number; outflow: number }>;
    healthTrend?: Array<{ month: string; score: number }>;
  };
  predictionData?: {
    estimatedSpending: number;
    likelySavings: number;
    riskLevel: string;
    forecastData: Record<string, number>;
  } | null;
  financialSummary: string;
  highestSpendingCategory: string;
  savingsAmount: number;
  overspendingWarnings: string[];
  emiBurdenPercentage: number;
  subscriptionWasteAmount: number;
  suggestions: string[];
  totalSpend?: number;
}

export interface ReportStats {
  currentAnalysisMonth: string;
  currentMonth: number;
  currentYear: number;
  currentStatus: ReportStatus;
  lastGeneratedReport: {
    reportMonth: string;
    generatedAt: string;
    totalSpend: number;
    financialHealthScore: number;
  } | null;
  nextReportDate: string;
  reportHistoryCount: number;
  healthTrend: Array<{ month: string; score: number }>;
  dataSources: {
    bankAccounts: number;
    upiAccounts: number;
    billsUploaded: number;
    activeLoans: number;
  };
}

export interface TimelineEntry {
  month: number;
  year: number;
  reportMonth: string;
  status: string;
  reportId: string | null;
  generatedAt: string | null;
  totalSpend: number | null;
}

export interface ReportComparison {
  spendingChange: number;
  savingsChange: number;
  investmentGrowth: number;
  loanReduction: number;
  emiChange: number;
  current: { spend: number; savings: number; healthScore: number };
  previous: { spend: number; savings: number; healthScore: number };
  chartData: Array<{ metric: string; current: number; previous: number }>;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatCurrency = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const formatReportDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
