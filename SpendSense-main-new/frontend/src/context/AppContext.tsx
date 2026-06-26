'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Transaction, Loan, Insurance, Investment, Subscription, Notification,
  initialUser, initialTransactions, initialLoans, initialInsurance, initialInvestments, initialSubscriptions, initialNotifications
} from '../utils/mockData';
import {
  StoredReport, ReportStats, TimelineEntry, ReportComparison
} from '../utils/reportTypes';
import {
  buildOfflineStoredReport, getLocalReports, saveLocalReport,
  buildLocalReportStats, buildLocalTimeline
} from '../utils/reportBuilder';
import {
  parseStatementFile, computeFileHash, getStoredStatementHashes,
  storeStatementHash, StatementUploadStatus
} from '../utils/statementParser';
import { getMockStatementTransactions, isMockableStatementFile } from '../utils/mockBankStatement';
import { filterNewStatementTransactions, inferBankFromUpiId } from '../utils/transactionDeduplication';

interface AppContextType {
  user: User;
  token: string | null;
  transactions: Transaction[];
  loans: Loan[];
  insurance: Insurance[];
  investments: Investment[];
  subscriptions: Subscription[];
  notifications: Notification[];
  loading: boolean;
  backendConnected: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  addInvestment: (inv: Omit<Investment, 'id' | 'updatedAt'>) => Promise<Investment>;
  addLoan: (loan: Omit<Loan, 'id' | 'remainingAmount' | 'paidEmis' | 'status'>) => Promise<Loan>;
  addInsurance: (ins: Omit<Insurance, 'id' | 'status'>) => Promise<Insurance>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'status'>) => Promise<Subscription>;
  linkBankAccount: (bankName: string, accountType?: string, initialBalance?: number) => Promise<any>;
  uploadBankStatement: (bankName: string, file: File, onStatus?: (status: StatementUploadStatus) => void) => Promise<any>;
  triggerStatementAnalytics: () => Promise<void>;
  linkUpiAccount: (upiId: string, bankName: string) => Promise<any>;
  uploadVaultDocument: (file: File, fileType: string) => Promise<any>;
  markNotificationsAsRead: () => void;
  triggerAIChat: (message: string) => Promise<string>;
  generateAIReport: (month: number, year: number, force?: boolean) => Promise<StoredReport | any>;
  reportHistory: StoredReport[];
  reportStats: ReportStats | null;
  reportTimeline: TimelineEntry[];
  fetchReportHistory: (year?: number, month?: number) => Promise<StoredReport[]>;
  fetchReportStats: () => Promise<ReportStats | null>;
  fetchReportTimeline: (year?: number) => Promise<TimelineEntry[]>;
  getReportById: (id: string) => Promise<StoredReport | null>;
  compareReports: (m1: number, y1: number, m2: number, y2: number) => Promise<ReportComparison | null>;
  uploadReceiptOCR: (file: File) => Promise<any>;
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  selectedUpi: string;
  setSelectedUpi: (upi: string) => void;
  syncUserData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function resolveAuthToken(activeToken: string | null): string | null {
  return activeToken || (typeof window !== 'undefined' ? localStorage.getItem('spendsense_token') : null);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(initialUser);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [insurance, setInsurance] = useState<Insurance[]>(initialInsurance);
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [reportHistory, setReportHistory] = useState<StoredReport[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [reportTimeline, setReportTimeline] = useState<TimelineEntry[]>([]);

  // Global filters for multi-account selector
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedUpi, setSelectedUpi] = useState<string>('all');

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('spendsense_token');
    const storedUser = localStorage.getItem('spendsense_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setBackendConnected(true);
      fetchUserData(storedToken);
    } else {
      loadFromLocalStorage();
      setLoading(false);
    }
  }, []);

  const loadFromLocalStorage = () => {
    const storedUser = localStorage.getItem('spendsense_user');
    const storedTx = localStorage.getItem('spendsense_tx');
    const storedLoans = localStorage.getItem('spendsense_loans');
    const storedInsurance = localStorage.getItem('spendsense_insurance');
    const storedInvestments = localStorage.getItem('spendsense_investments');
    const storedSubs = localStorage.getItem('spendsense_subs');
    const storedNot = localStorage.getItem('spendsense_notifications');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedTx) setTransactions(JSON.parse(storedTx));
    if (storedLoans) setLoans(JSON.parse(storedLoans));
    if (storedInsurance) setInsurance(JSON.parse(storedInsurance));
    if (storedInvestments) setInvestments(JSON.parse(storedInvestments));
    if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
    if (storedNot) setNotifications(JSON.parse(storedNot));
    
    setBackendConnected(false);
  };

  // Sync state to local storage when backend is offline
  useEffect(() => {
    if (!loading && !backendConnected) {
      localStorage.setItem('spendsense_user', JSON.stringify(user));
      localStorage.setItem('spendsense_tx', JSON.stringify(transactions));
      localStorage.setItem('spendsense_loans', JSON.stringify(loans));
      localStorage.setItem('spendsense_insurance', JSON.stringify(insurance));
      localStorage.setItem('spendsense_investments', JSON.stringify(investments));
      localStorage.setItem('spendsense_subs', JSON.stringify(subscriptions));
      localStorage.setItem('spendsense_notifications', JSON.stringify(notifications));
    }
  }, [user, transactions, loans, insurance, investments, subscriptions, notifications, loading, backendConnected]);

  // Fetch full user data scoped by JWT token
  const fetchUserData = async (activeToken: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${activeToken}` };
      const response = await fetch(`${API_URL}/dashboard`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        const txRes = await fetch(`${API_URL}/transactions`, { headers });
        if (txRes.ok) setTransactions(await txRes.json());
        
        const loanRes = await fetch(`${API_URL}/loans`, { headers });
        if (loanRes.ok) setLoans(await loanRes.json());
        
        const insRes = await fetch(`${API_URL}/insurance`, { headers });
        if (insRes.ok) setInsurance(await insRes.json());

        const invRes = await fetch(`${API_URL}/investments`, { headers });
        if (invRes.ok) setInvestments(await invRes.json());

        const subRes = await fetch(`${API_URL}/subscriptions`, { headers });
        if (subRes.ok) setSubscriptions(await subRes.json());

        const notRes = await fetch(`${API_URL}/notifications`, { headers });
        if (notRes.ok) setNotifications(await notRes.json());

        setBackendConnected(true);
      } else {
        loadFromLocalStorage();
      }
    } catch (err) {
      console.warn('⚠️ API connection failed, falling back to local simulation.');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const syncUserData = async () => {
    const t = token || localStorage.getItem('spendsense_token');
    if (t) {
      await fetchUserData(t);
    }
  };

  // Auth: Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('spendsense_token', data.token);
        localStorage.setItem('spendsense_user', JSON.stringify(data.user));
        setBackendConnected(true);
        await fetchUserData(data.token);
        return true;
      }
    } catch (err) {
      console.error('Login request error:', err);
    }
    // Simulation login fallback if backend offline - allow any email/password for demo
    const offlineUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      creditScore: 750,
      banks: [],
      linkedUpiIds: []
    };
    setUser(offlineUser);
    localStorage.setItem('spendsense_user', JSON.stringify(offlineUser));
    setBackendConnected(false);
    return true;
  };

  // Auth: Signup
  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('spendsense_token', data.token);
        localStorage.setItem('spendsense_user', JSON.stringify(data.user));
        setBackendConnected(true);
        await fetchUserData(data.token);
        return true;
      }
    } catch (err) {
      console.error('Signup request error:', err);
    }
    // Offline signup fallback
    const mockUserObj: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      creditScore: 750,
      banks: [],
      linkedUpiIds: []
    };
    setUser(mockUserObj);
    setTransactions([]);
    setLoans([]);
    setInsurance([]);
    setInvestments([]);
    setSubscriptions([]);
    setNotifications([
      {
        id: `not_welcome_${Date.now()}`,
        title: 'Welcome to SpendSense AI!',
        message: 'Get started by linking your first bank account or UPI ID to track expenses.',
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);
    
    localStorage.setItem('spendsense_user', JSON.stringify(mockUserObj));
    localStorage.setItem('spendsense_tx', JSON.stringify([]));
    localStorage.setItem('spendsense_loans', JSON.stringify([]));
    localStorage.setItem('spendsense_insurance', JSON.stringify([]));
    localStorage.setItem('spendsense_investments', JSON.stringify([]));
    localStorage.setItem('spendsense_subs', JSON.stringify([]));
    localStorage.setItem('spendsense_notifications', JSON.stringify([
      {
        id: `not_welcome_${Date.now()}`,
        title: 'Welcome to SpendSense AI!',
        message: 'Get started by linking your first bank account or UPI ID to track expenses.',
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]));
    setBackendConnected(false);
    return true;
  };

  // Auth: Logout
  const logout = () => {
    setToken(null);
    const emptyUser: User = { name: '', email: '', creditScore: 750, banks: [], linkedUpiIds: [] };
    setUser(emptyUser);
    setTransactions([]);
    setLoans([]);
    setInsurance([]);
    setInvestments([]);
    setSubscriptions([]);
    setNotifications([]);
    localStorage.removeItem('spendsense_token');
    localStorage.removeItem('spendsense_user');
    localStorage.removeItem('spendsense_tx');
    localStorage.removeItem('spendsense_loans');
    localStorage.removeItem('spendsense_insurance');
    localStorage.removeItem('spendsense_investments');
    localStorage.removeItem('spendsense_subs');
    localStorage.removeItem('spendsense_notifications');
    setBackendConnected(false);
  };

  // Add Transaction
  const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
    let resultTx: Transaction;

    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify(tx)
        });
        if (response.ok) {
          resultTx = await response.json();
          setTransactions(prev => [resultTx, ...prev]);
          await syncUserData();
          return resultTx;
        }
      } catch (err) {
        console.error('Failed to post transaction to backend:', err);
      }
    }

    // Local simulation fallback
    resultTx = {
      ...tx,
      id: `tx_${Date.now()}`
    };

    setTransactions(prev => [resultTx, ...prev]);

    // Update balances in state
    const updatedUser = { ...user };
    if (tx.paymentMode === 'Bank' && tx.bankName) {
      updatedUser.banks = updatedUser.banks.map(b => {
        if (b.bankName === tx.bankName) {
          return {
            ...b,
            balance: tx.type === 'income' ? b.balance + tx.amount : b.balance - tx.amount
          };
        }
        return b;
      });
    } else if (tx.paymentMode === 'UPI') {
      const targetBank =
        tx.bankName ||
        (tx.upiId ? inferBankFromUpiId(tx.upiId) : undefined) ||
        updatedUser.banks[0]?.bankName;
      if (targetBank && updatedUser.banks.length > 0) {
        updatedUser.banks = updatedUser.banks.map(b => {
          if (b.bankName === targetBank) {
            return {
              ...b,
              balance: tx.type === 'income' ? b.balance + tx.amount : b.balance - tx.amount
            };
          }
          return b;
        });
      }
    }
    setUser(updatedUser);

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      title: tx.type === 'income' ? 'Cash Received' : 'Transaction Alert',
      message: `₹${tx.amount} ${tx.type === 'income' ? 'credited' : 'spent on'} ${tx.title} via ${tx.paymentMode}.`,
      type: tx.type === 'income' ? 'success' : 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNot, ...prev]);

    return resultTx;
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${t}` }
        });
        if (response.ok) {
          setTransactions(prev => prev.filter(t => t.id !== id));
          return;
        }
      } catch (err) {
        console.error('Delete transaction failed:', err);
      }
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Link bank account
  const linkBankAccount = async (bankName: string, accountType?: string, initialBalance?: number): Promise<any> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/banks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify({ bankName, accountType, initialBalance })
        });
        if (response.ok) {
          const res = await response.json();
          await syncUserData();
          return res;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Local simulation
    const accountNum = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;
    const newBank = {
      bankName,
      accountNumber: accountNum,
      balance: initialBalance || 15000,
      accountType: accountType || 'Savings'
    };

    const updatedUser = {
      ...user,
      banks: [...user.banks, newBank]
    };
    setUser(updatedUser);

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      title: 'Bank Linked (Offline Mode)',
      message: `Your ${bankName} account ${accountNum} has been connected.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNot, ...prev]);

    return newBank;
  };

  const triggerStatementAnalytics = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const t = resolveAuthToken(token);

    await syncUserData();

    await Promise.allSettled([
      fetchReportStats(),
      fetchReportTimeline(),
      generateAIReport(month, year, true),
      backendConnected
        ? fetch(`${API_URL}/predictions`, { headers: { Authorization: `Bearer ${t}` } })
        : Promise.resolve()
    ]);
  };

  const applyLocalStatementTransactions = async (
    bankName: string,
    items: Array<{ amount: number; title: string; category: string; date: string; type: 'income' | 'expense' }>,
    fileHash: string,
    parseMethod: string
  ) => {
    const uid = getUserId();
    const { newTransactions, skipped } = filterNewStatementTransactions(
      items,
      transactions.map(t => ({ amount: t.amount, date: t.date, title: t.title, type: t.type, paymentMode: t.paymentMode }))
    );

    if (newTransactions.length === 0 && skipped > 0) {
      storeStatementHash(uid, fileHash);
      const msg = `All ${skipped} statement entries were already recorded (e.g. via UPI). No duplicates added.`;
      return {
        success: true,
        status: 'Completed' as StatementUploadStatus,
        message: msg,
        addedCount: 0,
        skippedCount: skipped,
        netDifference: 0,
        transactions: [],
        parseMethod,
        analyticsTriggered: false
      };
    }

    let balanceDiff = 0;
    const newTxList: Transaction[] = newTransactions.map((item, idx) => {
      const tx: Transaction = {
        id: `tx_statement_${Date.now()}_${idx}`,
        amount: item.amount,
        title: item.title,
        category: item.category,
        date: item.date,
        type: item.type,
        paymentMode: 'Bank',
        bankName
      };
      balanceDiff += item.type === 'income' ? item.amount : -item.amount;
      return tx;
    });

    setTransactions(prev => [...newTxList, ...prev]);
    setUser({
      ...user,
      banks: user.banks.map(b => b.bankName === bankName ? { ...b, balance: b.balance + balanceDiff } : b)
    });
    storeStatementHash(uid, fileHash);

    const skipNote = skipped > 0 ? ` ${skipped} duplicate(s) skipped (already recorded via UPI).` : '';
    const notMessage = `Bank statement processed successfully. ${newTxList.length} transactions added.${skipNote}`;
    setNotifications(prev => [{
      id: `not_${Date.now()}`,
      title: 'Bank Statement Processed',
      message: notMessage,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    }, ...prev]);

    return {
      success: true,
      status: 'Completed' as StatementUploadStatus,
      message: notMessage,
      addedCount: newTxList.length,
      skippedCount: skipped,
      netDifference: balanceDiff,
      transactions: newTxList,
      parseMethod,
      analyticsTriggered: true
    };
  };

  // Upload Bank Statement — mock data for PDF/images, CSV parsing otherwise
  const uploadBankStatement = async (
    bankName: string,
    file: File,
    onStatus?: (status: StatementUploadStatus) => void
  ): Promise<any> => {
    const setStatus = (s: StatementUploadStatus) => onStatus?.(s);
    const t = resolveAuthToken(token);
    const useMockExtract = isMockableStatementFile(file.name);

    setStatus('Uploading');
    if (useMockExtract) {
      setStatus('Reading PDF');
      setStatus('Running OCR');
    }

    if (backendConnected) {
      try {
        setStatus('Extracting Transactions');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankName', bankName);

        const response = await fetch(`${API_URL}/banks/statement`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${t}` },
          body: formData
        });
        const res = await response.json();

        if (response.status === 409) {
          return { ...res, duplicate: true };
        }
        if (!response.ok) {
          return res;
        }

        setStatus('Analyzing');
        await syncUserData();
        if (res.analyticsTriggered) {
          await triggerStatementAnalytics();
        }
        setStatus('Completed');
        return res;
      } catch (err) {
        console.error('Backend statement upload failed, applying local mock:', err);
        if (useMockExtract) {
          const uid = getUserId();
          const fileHash = await computeFileHash(file);
          if (getStoredStatementHashes(uid).includes(fileHash)) {
            return {
              duplicate: true,
              message: 'This bank statement has already been processed. Duplicate upload prevented.',
              status: 'Completed' as StatementUploadStatus
            };
          }
          setStatus('Analyzing');
          const result = await applyLocalStatementTransactions(
            bankName,
            getMockStatementTransactions(bankName),
            fileHash,
            'Mock Statement Data (sample PDF)'
          );
          await triggerStatementAnalytics();
          setStatus('Completed');
          return result;
        }
      }
    }

    // Offline: mock for PDF/images, real parsing for CSV/TXT
    const uid = getUserId();
    const fileHash = await computeFileHash(file);
    if (getStoredStatementHashes(uid).includes(fileHash)) {
      return {
        duplicate: true,
        message: 'This bank statement has already been processed. Duplicate upload prevented.',
        status: 'Completed' as StatementUploadStatus
      };
    }

    if (useMockExtract) {
      setStatus('Extracting Transactions');
      setStatus('Analyzing');
      const result = await applyLocalStatementTransactions(
        bankName,
        getMockStatementTransactions(bankName),
        fileHash,
        'Mock Statement Data (sample PDF)'
      );
      await triggerStatementAnalytics();
      setStatus('Completed');
      return result;
    }

    setStatus('Extracting Transactions');
    const parsed = await parseStatementFile(file, bankName);
    const { newTransactions, skipped } = filterNewStatementTransactions(
      parsed.transactions,
      transactions.map(t => ({ amount: t.amount, date: t.date, title: t.title, type: t.type, paymentMode: t.paymentMode }))
    );

    if (newTransactions.length === 0) {
      if (skipped > 0) {
        storeStatementHash(uid, fileHash);
        return {
          success: true,
          message: `All ${skipped} statement entries were already recorded (e.g. via UPI). No duplicates added.`,
          status: 'Completed' as StatementUploadStatus,
          addedCount: 0,
          skippedCount: skipped
        };
      }
      return {
        success: false,
        message: 'No transaction table detected in uploaded statement.',
        status: 'Completed' as StatementUploadStatus,
        addedCount: 0
      };
    }

    let balanceDiff = 0;
    const newTxList: Transaction[] = newTransactions.map((item, idx) => {
      const tx: Transaction = {
        id: `tx_statement_${Date.now()}_${idx}`,
        amount: item.amount,
        title: item.title,
        category: item.category,
        date: item.date,
        type: item.type,
        paymentMode: 'Bank',
        bankName
      };
      balanceDiff += item.type === 'income' ? item.amount : -item.amount;
      return tx;
    });

    setTransactions(prev => [...newTxList, ...prev]);
    const updatedUser = {
      ...user,
      banks: user.banks.map(b => b.bankName === bankName ? { ...b, balance: b.balance + balanceDiff } : b)
    };
    setUser(updatedUser);
    storeStatementHash(uid, fileHash);

    const skipNote = skipped > 0 ? ` ${skipped} duplicate(s) skipped (already recorded via UPI).` : '';
    const notMessage = `Bank statement processed successfully. ${newTxList.length} transactions added.${skipNote}`;
    const newNot: Notification = {
      id: `not_${Date.now()}`,
      title: 'Bank Statement Processed',
      message: notMessage,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNot, ...prev]);

    setStatus('Analyzing');
    await triggerStatementAnalytics();
    setStatus('Completed');

    return {
      success: true,
      addedCount: newTxList.length,
      skippedCount: skipped,
      message: notMessage,
      status: 'Completed',
      event: 'BANK_STATEMENT_UPLOADED',
      analyticsTriggered: true,
      extracted: { parseMethod: parsed.parseMethod }
    };
  };

  // Link UPI handle
  const linkUpiAccount = async (upiId: string, bankName: string): Promise<any> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/upi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify({ upiId, bankName })
        });
        if (response.ok) {
          const res = await response.json();
          setUser(prev => ({
            ...prev,
            linkedUpiIds: prev.linkedUpiIds.includes(upiId)
              ? prev.linkedUpiIds
              : [...prev.linkedUpiIds, upiId]
          }));
          await syncUserData();
          return { ...res, upiId, bankName, verified: true };
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Local simulation
    const updatedUser = {
      ...user,
      linkedUpiIds: user.linkedUpiIds.includes(upiId) ? user.linkedUpiIds : [...user.linkedUpiIds, upiId]
    };
    setUser(updatedUser);

    const newNot: Notification = {
      id: `not_${Date.now()}`,
      title: 'UPI Handle Verified',
      message: `${upiId} successfully linked to your ${bankName} account.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNot, ...prev]);

    return { upiId, bankName, verified: true };
  };

  // Upload Vault Document (Simulated OCR Parser)
  const uploadVaultDocument = async (file: File, fileType: string): Promise<any> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);
        if (fileType === 'bank_statement') {
          formData.append('bankName', user.banks[0]?.bankName || 'HDFC');
        }

        const response = await fetch(`${API_URL}/documents/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${t}` },
          body: formData
        });
        const res = await response.json();
        if (response.ok) {
          await syncUserData();
          if (fileType === 'bank_statement' && res.analyticsTriggered) {
            await triggerStatementAnalytics();
          }
          return res;
        }
        if (response.status === 409 || response.status === 422) return res;
      } catch (err) {
        console.error(err);
      }
    }

    // Local simulation
    return new Promise((resolve) => {
      setTimeout(async () => {
        let summary = '';
        if (fileType === 'insurance') {
          const ins: Insurance = {
            id: `ins_vault_${Date.now()}`,
            policyName: 'ACKO Health Safeguard',
            provider: 'ACKO',
            policyType: 'Health',
            coverageAmount: 2500000,
            premiumAmount: 12000,
            paymentInterval: 'Yearly',
            nextPremiumDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          };
          setInsurance(prev => [...prev, ins]);
          summary = 'ACKO Health Safeguard Policy (₹12,000/y premium) extracted.';
        } else if (fileType === 'loan') {
          const loan: Loan = {
            id: `loan_vault_${Date.now()}`,
            loanName: 'Education Debt Loan',
            bankName: 'SBI',
            totalAmount: 300000,
            remainingAmount: 300000,
            emiAmount: 8500,
            interestRate: 9.5,
            durationMonths: 48,
            paidEmis: 0,
            nextEmiDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          };
          setLoans(prev => [...prev, loan]);
          summary = 'SBI Education Loan (₹3,00,000 at 9.5% interest) extracted.';
        } else if (fileType === 'bank_statement') {
          const bankName = user.banks[0]?.bankName || 'HDFC';
          const parsed = await parseStatementFile(file, bankName);
          if (parsed.transactions.length === 0) {
            resolve({ summary: 'No transaction table detected in uploaded statement.', success: false });
            return;
          }
          const fileHash = await computeFileHash(file);
          if (getStoredStatementHashes(getUserId()).includes(fileHash)) {
            resolve({ summary: 'This statement was already processed.', duplicate: true });
            return;
          }
          let balanceDiff = 0;
          const newTxList = parsed.transactions.map((item, idx) => {
            const tx: Transaction = {
              id: `tx_vault_stmt_${Date.now()}_${idx}`,
              amount: item.amount,
              title: item.title,
              category: item.category,
              date: item.date,
              type: item.type,
              paymentMode: 'Bank',
              bankName
            };
            balanceDiff += item.type === 'income' ? item.amount : -item.amount;
            return tx;
          });
          setTransactions(prev => [...newTxList, ...prev]);
          setUser({
            ...user,
            banks: user.banks.map(b => b.bankName === bankName ? { ...b, balance: b.balance + balanceDiff } : b)
          });
          storeStatementHash(getUserId(), fileHash);
          summary = `Bank statement processed successfully. ${newTxList.length} transactions added and analytics updated.`;
          setNotifications(prev => [{
            id: `not_${Date.now()}`,
            title: 'Bank Statement Processed',
            message: summary,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
          }, ...prev]);
          await triggerStatementAnalytics();
          resolve({ summary, addedCount: newTxList.length, event: 'BANK_STATEMENT_UPLOADED' });
          return;
        } else {
          summary = 'Document analyzed successfully. Saved to files catalog.';
        }

        const newNot: Notification = {
          id: `not_${Date.now()}`,
          title: 'Vault Scanner Success',
          message: `Document "${file.name}" analyzed: ${summary}`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNot, ...prev]);

        resolve({ summary });
      }, 2000);
    });
  };

  // Add stock investment
  const addInvestment = async (inv: Omit<Investment, 'id' | 'updatedAt'>): Promise<Investment> => {
    let resultInv: Investment;
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/investments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify(inv)
        });
        if (response.ok) {
          resultInv = await response.json();
          setInvestments(prev => [...prev, resultInv]);
          return resultInv;
        }
      } catch (err) {
        console.error('Failed to post investment to backend:', err);
      }
    }

    resultInv = {
      ...inv,
      id: `inv_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    setInvestments(prev => [...prev, resultInv]);
    return resultInv;
  };

  // Add Loan
  const addLoan = async (loan: Omit<Loan, 'id' | 'remainingAmount' | 'paidEmis' | 'status'>): Promise<Loan> => {
    let resultLoan: Loan;
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/loans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify(loan)
        });
        if (response.ok) {
          resultLoan = await response.json();
          setLoans(prev => [...prev, resultLoan]);
          return resultLoan;
        }
      } catch (err) {
        console.error(err);
      }
    }

    resultLoan = {
      ...loan,
      id: `ln_${Date.now()}`,
      remainingAmount: loan.totalAmount,
      paidEmis: 0,
      status: 'active'
    };
    setLoans(prev => [...prev, resultLoan]);
    return resultLoan;
  };

  // Add Insurance
  const addInsurance = async (ins: Omit<Insurance, 'id' | 'status'>): Promise<Insurance> => {
    let resultIns: Insurance;
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/insurance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify(ins)
        });
        if (response.ok) {
          resultIns = await response.json();
          setInsurance(prev => [...prev, resultIns]);
          return resultIns;
        }
      } catch (err) {
        console.error(err);
      }
    }

    resultIns = {
      ...ins,
      id: `ins_${Date.now()}`,
      status: 'active'
    };
    setInsurance(prev => [...prev, resultIns]);
    return resultIns;
  };

  // Add Subscription
  const addSubscription = async (sub: Omit<Subscription, 'id' | 'status'>): Promise<Subscription> => {
    let resultSub: Subscription;
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify(sub)
        });
        if (response.ok) {
          resultSub = await response.json();
          setSubscriptions(prev => [...prev, resultSub]);
          return resultSub;
        }
      } catch (err) {
        console.error(err);
      }
    }

    resultSub = {
      ...sub,
      id: `sub_${Date.now()}`,
      status: 'active'
    };
    setSubscriptions(prev => [...prev, resultSub]);
    return resultSub;
  };

  // Mark notifications read
  const markNotificationsAsRead = async () => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        await fetch(`${API_URL}/notifications/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${t}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Trigger Chatbot advisor
  const triggerAIChat = async (message: string): Promise<string> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify({ message })
        });
        if (response.ok) {
          const resData = await response.json();
          return resData.reply;
        }
      } catch (err) {
        console.error('Chat API failed:', err);
      }
    }

    // Client-side rule simulator fallback
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowercase = message.toLowerCase();
        if (lowercase.includes('food') || lowercase.includes('swiggy')) {
          const total = transactions.filter(t => t.category === 'Food').reduce((sum, t) => sum + t.amount, 0);
          resolve(`You spent **₹${total.toLocaleString('en-IN')}** on Food. I recommend setting a weekly Swiggy budget limit of ₹1,000 to save about **₹2,200** monthly.`);
        } else if (lowercase.includes('balance') || lowercase.includes('bank')) {
          const total = user.banks.reduce((sum, b) => sum + b.balance, 0);
          const accountsList = user.banks.map(b => `- **${b.bankName}**: ₹${b.balance.toLocaleString('en-IN')}`).join('\n');
          resolve(`Here are your connected bank balances:\n${accountsList}\n**Combined Net Balance: ₹${total.toLocaleString('en-IN')}**`);
        } else if (lowercase.includes('credit') || lowercase.includes('score')) {
          resolve(`Your current Financial Health Credit Score is **${user.creditScore}**. This is considered **Excellent**. To push it past 800:
1. Maintain credit card utilization below 30%.
2. Ensure active bank EMIs are settled on schedule.`);
        } else {
          resolve(`Hello! I'm SpendSense AI, your personal financial advisor. I've scanned your connected banks and transactions. Ask me about your balance, credit score, food spending, or EMI details.`);
        }
      }, 1000);
    });
  };

  const getUserId = () => user.id || user.email || 'local_user';

  const fetchReportHistory = async (year?: number, month?: number): Promise<StoredReport[]> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const params = new URLSearchParams();
        if (year) params.set('year', String(year));
        if (month) params.set('month', String(month));
        const res = await fetch(`${API_URL}/reports?${params}`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReportHistory(data);
          return data;
        }
      } catch (err) {
        console.error('fetchReportHistory failed:', err);
      }
    }
    const uid = getUserId();
    let reports = getLocalReports(uid);
    if (year) reports = reports.filter(r => r.year === year);
    if (month) reports = reports.filter(r => r.month === month);
    reports.sort((a, b) => b.year - a.year || b.month - a.month);
    setReportHistory(reports);
    return reports;
  };

  const fetchReportStats = async (): Promise<ReportStats | null> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const res = await fetch(`${API_URL}/reports/stats`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReportStats(data);
          return data;
        }
      } catch (err) {
        console.error('fetchReportStats failed:', err);
      }
    }
    const uid = getUserId();
    const reports = getLocalReports(uid);
    const stats = buildLocalReportStats(
      reports,
      user.banks?.length || 0,
      user.linkedUpiIds?.length || 0,
      0,
      loans.filter(l => l.status === 'active').length,
      transactions.length
    );
    setReportStats(stats);
    return stats;
  };

  const fetchReportTimeline = async (year?: number): Promise<TimelineEntry[]> => {
    const y = year || new Date().getFullYear();
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const res = await fetch(`${API_URL}/reports/timeline?year=${y}`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReportTimeline(data);
          return data;
        }
      } catch (err) {
        console.error('fetchReportTimeline failed:', err);
      }
    }
    const uid = getUserId();
    const reports = getLocalReports(uid);
    const timeline = buildLocalTimeline(reports, y);
    setReportTimeline(timeline);
    return timeline;
  };

  const getReportById = async (id: string): Promise<StoredReport | null> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const res = await fetch(`${API_URL}/reports/${id}`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('getReportById failed:', err);
      }
    }
    const uid = getUserId();
    return getLocalReports(uid).find(r => r.id === id) || null;
  };

  const compareReports = async (
    m1: number, y1: number, m2: number, y2: number
  ): Promise<ReportComparison | null> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_URL}/reports/compare?month1=${m1}&year1=${y1}&month2=${m2}&year2=${y2}`,
          { headers: { Authorization: `Bearer ${t}` } }
        );
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('compareReports failed:', err);
      }
    }
    const uid = getUserId();
    const reports = getLocalReports(uid);
    const current = reports.find(r => r.month === m1 && r.year === y1);
    const previous = reports.find(r => r.month === m2 && r.year === y2);
    if (!current || !previous) return null;
    const curSpend = current.spendingSummary?.totalExpense || 0;
    const prevSpend = previous.spendingSummary?.totalExpense || 0;
    const curSav = current.spendingSummary?.netSavings || current.savingsAmount || 0;
    const prevSav = previous.spendingSummary?.netSavings || previous.savingsAmount || 0;
    const pct = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 1000) / 10;
    return {
      spendingChange: pct(curSpend, prevSpend),
      savingsChange: pct(curSav, prevSav),
      investmentGrowth: (current.investmentAnalysis?.profitPercent || 0) - (previous.investmentAnalysis?.profitPercent || 0),
      loanReduction: previous.loanAnalysis?.totalRemaining
        ? Math.round(((previous.loanAnalysis.totalRemaining - (current.loanAnalysis?.totalRemaining || 0)) / previous.loanAnalysis.totalRemaining) * 1000) / 10
        : 0,
      emiChange: (current.loanAnalysis?.totalEmi || 0) - (previous.loanAnalysis?.totalEmi || 0),
      current: { spend: curSpend, savings: curSav, healthScore: current.financialHealthScore },
      previous: { spend: prevSpend, savings: prevSav, healthScore: previous.financialHealthScore },
      chartData: [
        { metric: 'Spending', current: curSpend, previous: prevSpend },
        { metric: 'Savings', current: curSav, previous: prevSav },
        { metric: 'Health Score', current: current.financialHealthScore, previous: previous.financialHealthScore }
      ]
    };
  };

  // Generate Monthly AI report (persists to history)
  const generateAIReport = async (month: number, year: number, force?: boolean): Promise<StoredReport | any> => {
    const t = resolveAuthToken(token);
    if (backendConnected) {
      try {
        const response = await fetch(`${API_URL}/reports/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify({ month, year, force })
        });
        if (response.ok) {
          const data = await response.json();
          setReportHistory(prev => {
            const filtered = prev.filter(r => !(r.month === month && r.year === year));
            return [data, ...filtered].sort((a, b) => b.year - a.year || b.month - a.month);
          });
          return data;
        }
      } catch (err) {
        console.error('Report API failed:', err);
      }
    }

    // Client simulated report fallback with local persistence
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const totalExp = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalInc = transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const savings = Math.max(0, totalInc - totalExp);

    const categories: Record<string, number> = {};
    expenses.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });

    let highestCat = 'Others';
    let highestAmt = 0;
    Object.entries(categories).forEach(([cat, amt]) => {
      if (amt > highestAmt) { highestAmt = amt; highestCat = cat; }
    });

    const emiTotal = loans.reduce((sum, l) => sum + l.emiAmount, 0);
    const emiBurden = totalInc > 0 ? Math.round((emiTotal / totalInc) * 100) : 0;
    const waste = subscriptions.filter(s => s.usageFrequency === 'low').reduce((sum, s) => sum + s.cost, 0);

    const future: Record<string, number> = {};
    Object.entries(categories).forEach(([cat, amt]) => {
      future[cat] = Math.round(amt * 0.96);
    });

    const aiContent = {
      financialSummary: `Offline Report Mode: You earned ₹${totalInc.toLocaleString()} and spent ₹${totalExp.toLocaleString()} this month. Your highest expense category was "${highestCat}" representing ₹${highestAmt.toLocaleString()}. EMIs account for ${emiBurden}% of your income.`,
      highestSpendingCategory: highestCat,
      savingsAmount: savings,
      overspendingWarnings: [
        totalExp > 30000 ? 'Lifestyle expenditures are elevated.' : 'Discretionary spend is within stable thresholds.',
        `Active subscriptions cost ₹${subscriptions.reduce((sum, s) => sum + s.cost, 0)}/m.`
      ],
      emiBurdenPercentage: emiBurden,
      subscriptionWasteAmount: waste,
      futurePredictions: future,
      suggestions: [
        'Cancel Netflix or low-usage subscription services to save.',
        'Allocate ₹5,000 to index funds through Groww.',
        'Add a health insurance top-up to double benefits.'
      ]
    };

    const uid = getUserId();
    if (!force) {
      const existing = getLocalReports(uid).find(r => r.month === month && r.year === year);
      if (existing) return existing;
    }

    const stored = buildOfflineStoredReport(
      month, year, transactions, loans, insurance, investments, subscriptions, aiContent, uid
    );
    saveLocalReport(uid, stored);
    setReportHistory(prev => {
      const filtered = prev.filter(r => !(r.month === month && r.year === year));
      return [stored, ...filtered].sort((a, b) => b.year - a.year || b.month - a.month);
    });
    return stored;
  };

  // Upload receipt bill scanner OCR (Tesseract client side + backend API fallback)
  const uploadReceiptOCR = async (file: File): Promise<any> => {
    const t = resolveAuthToken(token);

    // 1. Run client-side Tesseract OCR to read text
    let text = '';
    let ocrConfidence = 0;
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng');
      text = result.data.text;
      // Get average confidence from Tesseract
      ocrConfidence = result.data.confidence || 0;
      console.log('Client-side OCR extracted text:', text, 'confidence:', ocrConfidence);
    } catch (err) {
      console.error('Client-side OCR error:', err);
    }

    // 2. Parse merchant, amount, category & date from extracted text
    let merchant = 'Retail Store';
    let amount = 250;
    let dateStr = new Date().toISOString();
    let category = 'Others';
    const confidence = text ? `${Math.min(99, Math.max(55, Math.round(ocrConfidence)))}%` : '62%';

    if (text) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Parse Amount
      let hasFoundAmount = false;
      const totalKeywords = /(?:total|grand\s*total|net\s*payable|amount|payable|sum|due|paid|final|total\s*amount|total\s*due|subtotal|balance|cash|card|visa|mastercard|net)\b/i;
      
      const totalLines = lines.filter(line => totalKeywords.test(line));
      let parsedAmount = 0;
      
      for (const line of totalLines) {
        if (/\b(?:gst|tax|vat|rate|%)\b/i.test(line) && !/total/i.test(line)) {
          continue;
        }
        const matches = line.match(/[\d,]+\.\d{2}/g);
        if (matches) {
          for (const m of matches) {
            const val = parseFloat(m.replace(/,/g, ''));
            if (!isNaN(val) && val > parsedAmount) {
              parsedAmount = val;
              hasFoundAmount = true;
            }
          }
        }
      }
      
      if (!hasFoundAmount) {
        for (const line of totalLines) {
          if (/\b(?:gst|tax|vat|rate|%)\b/i.test(line) && !/total/i.test(line)) {
            continue;
          }
          const matches = line.match(/\b\d{2,5}\b/g);
          if (matches) {
            for (const m of matches) {
              const val = parseFloat(m);
              if (!isNaN(val) && val > parsedAmount) {
                parsedAmount = val;
                hasFoundAmount = true;
              }
            }
          }
        }
      }
      
      if (!hasFoundAmount) {
        const allDecimals = text.match(/[\d,]+\.\d{2}/g);
        if (allDecimals) {
          const vals = allDecimals.map(d => parseFloat(d.replace(/,/g, ''))).filter(v => !isNaN(v) && v < 500000);
          if (vals.length > 0) {
            parsedAmount = Math.max(...vals);
            hasFoundAmount = true;
          }
        }
      }
      
      if (!hasFoundAmount) {
        const allInts = text.match(/\b\d{2,5}\b/g);
        if (allInts) {
          const vals = allInts.map(i => parseFloat(i)).filter(v => !isNaN(v) && v >= 10 && v <= 10000);
          if (vals.length > 0) {
            parsedAmount = Math.max(...vals);
            hasFoundAmount = true;
          }
        }
      }
      
      if (hasFoundAmount && parsedAmount > 0) {
        amount = Math.round(parsedAmount);
      } else {
        const matches = text.match(/\b\d{2,4}\b/g);
        if (matches) {
          const vals = matches.map(m => parseInt(m)).filter(v => v >= 10 && v <= 5000);
          if (vals.length > 0) {
            amount = Math.max(...vals);
          }
        }
      }

      // Parse Merchant Name
      const blacklist = ['receipt', 'tax', 'invoice', 'bill', 'welcome', 'cash', 'memo', 'customer', 'date', 'time', 'total', 'grand', 'amount', 'tel', 'phone', 'address', 'store', 'terminal', 'gst', 'no:', 'order'];
      for (let i = 0; i < Math.min(6, lines.length); i++) {
        const clean = lines[i].replace(/[^a-zA-Z\s]/g, '').trim();
        if (clean.length > 2) {
          const lower = clean.toLowerCase();
          const isBlack = blacklist.some(w => lower.includes(w));
          if (!isBlack) {
            merchant = clean;
            break;
          }
        }
      }
      
      if (!merchant || merchant === 'Retail Store') {
        const cleanFile = file.name.split('.')[0].replace(/[^a-zA-Z]/g, ' ').trim();
        if (cleanFile.length > 2) {
          merchant = cleanFile.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
          merchant = 'Retail Store';
        }
      }

      // Parse Date
      const dateRegex = /\b(\d{1,2})[\/\-\.](\d{1,2}|[a-zA-Z]{3})[\/\-\.](\d{2,4})\b/;
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
        const dStr = dateMatch[0];
        try {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString();
          }
        } catch {}
      }
      
      category = suggestCategory(merchant);
    } else {
      const cleanFile = file.name.split('.')[0].replace(/[^a-zA-Z]/g, ' ').trim();
      if (cleanFile.length > 2) {
        merchant = cleanFile.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      category = suggestCategory(merchant);
      const numMatch = file.name.match(/\b\d{2,5}\b/);
      if (numMatch) {
        amount = parseInt(numMatch[0]);
      }
    }

    if (backendConnected) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('extractedMerchant', merchant);
        formData.append('extractedAmount', amount.toString());
        formData.append('extractedCategory', category);
        formData.append('extractedDate', dateStr);
        
        const response = await fetch(`${API_URL}/scan`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${t}` },
          body: formData
        });
        if (response.ok) {
          const res = await response.json();
          setTransactions(prev => [res.data.transaction, ...prev]);
          await syncUserData();
          return res.data;
        }
      } catch (err) {
        console.error('OCR API failed:', err);
      }
    }

    // Client-side simulation fallback (offline mode)
    return new Promise((resolve) => {
      setTimeout(() => {
        const tx: Transaction = {
          id: `tx_${Date.now()}`,
          amount,
          title: `${merchant} (OCR Scanned)`,
          category,
          date: dateStr,
          type: 'expense',
          paymentMode: 'UPI',
          upiId: user.linkedUpiIds?.[0] || 'demo@oksbi'
        };

        setTransactions(prev => [tx, ...prev]);

        const newNot: Notification = {
          id: `not_${Date.now()}`,
          title: 'Bill Scanned (Offline Mode)',
          message: `Processed OCR: ₹${amount} at ${merchant}. Added to transactions.`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNot, ...prev]);

        resolve({
          merchant,
          amount,
          date: new Date(dateStr).toLocaleDateString(),
          category,
          confidence,
          transaction: tx
        });
      }, 500);
    });
  };

  return (
    <AppContext.Provider value={{
      user, token, transactions, loans, insurance, investments, subscriptions, notifications, loading, backendConnected,
      login, signup, logout, addTransaction, deleteTransaction, addInvestment, addLoan, addInsurance, addSubscription,
      linkBankAccount, uploadBankStatement, linkUpiAccount, uploadVaultDocument, markNotificationsAsRead,
      triggerAIChat, generateAIReport, uploadReceiptOCR, triggerStatementAnalytics,
      reportHistory, reportStats, reportTimeline,
      fetchReportHistory, fetchReportStats, fetchReportTimeline, getReportById, compareReports,
      selectedBank, setSelectedBank, selectedUpi, setSelectedUpi, syncUserData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const suggestCategory = (title: string): string => {
  const lowercase = title.toLowerCase();
  if (lowercase.includes('uber') || lowercase.includes('ola') || lowercase.includes('cab') || lowercase.includes('auto') || lowercase.includes('petrol') || lowercase.includes('fuel') || lowercase.includes('shell') || lowercase.includes('diesel')) {
    return 'Fuel';
  }
  if (lowercase.includes('starbucks') || lowercase.includes('swiggy') || lowercase.includes('zomato') || lowercase.includes('mcdonald') || lowercase.includes('kfc') || lowercase.includes('restaurant') || lowercase.includes('burger') || lowercase.includes('pizza') || lowercase.includes('food') || lowercase.includes('cafe')) {
    return 'Food';
  }
  if (lowercase.includes('netflix') || lowercase.includes('spotify') || lowercase.includes('prime') || lowercase.includes('hotstar') || lowercase.includes('hulu') || lowercase.includes('movie') || lowercase.includes('cinema') || lowercase.includes('show')) {
    return 'Entertainment';
  }
  if (lowercase.includes('jio') || lowercase.includes('airtel') || lowercase.includes('vi ') || lowercase.includes('recharge') || lowercase.includes('mobile') || lowercase.includes('telecom') || lowercase.includes('fiber') || lowercase.includes('internet') || lowercase.includes('wifi')) {
    return 'Recharge';
  }
  if (lowercase.includes('zara') || lowercase.includes('amazon') || lowercase.includes('flipkart') || lowercase.includes('shopping') || lowercase.includes('myntra') || lowercase.includes('groceries') || lowercase.includes('mall') || lowercase.includes('tshirt') || lowercase.includes('shoes')) {
    return 'Shopping';
  }
  if (lowercase.includes('groww') || lowercase.includes('sip') || lowercase.includes('stock') || lowercase.includes('mutual') || lowercase.includes('share') || lowercase.includes('investment')) {
    return 'Investments';
  }
  if (lowercase.includes('rent') || lowercase.includes('landlord') || lowercase.includes('room') || lowercase.includes('apartment')) {
    return 'Rent';
  }
  return 'Others';
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
};

export default AppContext;
