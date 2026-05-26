export interface User {
  id?: string;
  name: string;
  email: string;
  creditScore: number;
  banks: Array<{ bankName: string; accountNumber: string; balance: number; accountType: string }>;
  linkedUpiIds: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  title: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
  paymentMode: 'UPI' | 'Bank' | 'Cash';
  upiId?: string;
  bankName?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  loanName: string;
  bankName: string;
  totalAmount: number;
  remainingAmount: number;
  emiAmount: number;
  interestRate: number;
  durationMonths: number;
  paidEmis: number;
  nextEmiDate: string;
  status: 'active' | 'closed';
}

export interface Insurance {
  id: string;
  policyName: string;
  provider: string;
  policyType: 'Health' | 'Life' | 'Vehicle' | 'Investment-Linked';
  coverageAmount: number;
  premiumAmount: number;
  paymentInterval: 'Monthly' | 'Quarterly' | 'Yearly';
  nextPremiumDate: string;
  status: 'active' | 'expired' | 'lapsed';
}

export interface Investment {
  id: string;
  stockSymbol: string;
  stockName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investmentType: 'Stock' | 'Mutual Fund' | 'Gold';
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  interval: 'Monthly' | 'Yearly';
  nextBillingDate: string;
  status: 'active' | 'cancelled';
  category: 'OTT' | 'Mobile' | 'Internet' | 'Utilities' | 'Others';
  usageFrequency: 'low' | 'medium' | 'high';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  isRead: boolean;
  createdAt: string;
}

// Default user - empty state (new user onboarding)
export const initialUser: User = {
  name: '',
  email: '',
  creditScore: 750,
  banks: [],
  linkedUpiIds: []
};

export const initialTransactions: Transaction[] = [];

export const initialLoans: Loan[] = [];

export const initialInsurance: Insurance[] = [];

export const initialInvestments: Investment[] = [];

export const initialSubscriptions: Subscription[] = [];

export const initialNotifications: Notification[] = [];

export const availableStocks = [
  { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd', currentPrice: 1084.20 },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', currentPrice: 2890.75 },
  { symbol: 'INFY', name: 'Infosys Ltd', currentPrice: 1445.60 },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', currentPrice: 196.40 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', currentPrice: 3850.00 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', currentPrice: 462.50 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', currentPrice: 1512.40 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', currentPrice: 1120.90 }
];
