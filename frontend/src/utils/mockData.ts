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
  // Top IT
  { symbol: 'TCS', name: 'Tata Consultancy Services', currentPrice: 3850.00 },
  { symbol: 'INFY', name: 'Infosys Ltd', currentPrice: 1445.60 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', currentPrice: 462.50 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', currentPrice: 1350.25 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', currentPrice: 1210.80 },
  // Top Banks & Finance
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', currentPrice: 1512.40 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', currentPrice: 1120.90 },
  { symbol: 'SBIN', name: 'State Bank of India', currentPrice: 785.30 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', currentPrice: 1050.65 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', currentPrice: 1780.00 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', currentPrice: 6540.20 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', currentPrice: 1580.45 },
  // Oil & Energy
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', currentPrice: 2890.75 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', currentPrice: 275.40 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', currentPrice: 289.10 },
  { symbol: 'NTPC', name: 'NTPC Ltd', currentPrice: 345.60 },
  { symbol: 'TATAPOWER', name: 'Tata Power Co', currentPrice: 410.80 },
  // FMCG
  { symbol: 'ITC', name: 'ITC Ltd', currentPrice: 420.50 },
  { symbol: 'HUL', name: 'Hindustan Unilever Ltd', currentPrice: 2450.80 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', currentPrice: 2510.30 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', currentPrice: 4890.15 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', currentPrice: 1120.40 },
  // Auto
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', currentPrice: 12340.50 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', currentPrice: 985.20 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', currentPrice: 1850.75 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', currentPrice: 8940.10 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', currentPrice: 4560.30 },
  // Metals & Mining
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', currentPrice: 156.80 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', currentPrice: 580.40 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', currentPrice: 845.90 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', currentPrice: 450.25 },
  // Pharma
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', currentPrice: 1520.60 },
  { symbol: 'CIPLA', name: 'Cipla Ltd', currentPrice: 1340.80 },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', currentPrice: 5890.45 },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories', currentPrice: 3840.20 },
  // Infrastructure & Cement
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', currentPrice: 3650.10 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', currentPrice: 9850.30 },
  { symbol: 'GRASIM', name: 'Grasim Industries', currentPrice: 2180.50 },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements', currentPrice: 590.20 },
  // New Age / Tech
  { symbol: 'ZOMATO', name: 'Zomato Ltd', currentPrice: 196.40 },
  { symbol: 'PAYTM', name: 'One97 Communications', currentPrice: 410.80 },
  { symbol: 'NYKAA', name: 'FSN E-Commerce', currentPrice: 165.20 },
  // Others
  { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd', currentPrice: 1084.20 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', currentPrice: 3120.40 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', currentPrice: 1345.80 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', currentPrice: 3580.90 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', currentPrice: 2840.50 },
  // Indices (Simulated as stocks for tracking)
  { symbol: 'NIFTY50', name: 'Nifty 50 Index', currentPrice: 22450.80 },
  { symbol: 'SENSEX', name: 'BSE Sensex', currentPrice: 73850.40 },
];
