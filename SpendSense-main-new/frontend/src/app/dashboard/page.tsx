'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  CreditCard,
  Tv,
  Calendar,
  AlertTriangle,
  ArrowRight,
  User,
  Plus,
  CheckCircle2,
  Lock,
  ChevronRight,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';
import NotificationDrawer from '../../components/NotificationDrawer';
import DashboardReportSection from '../../components/DashboardReportSection';
import Link from 'next/link';

// Import Recharts components
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function DashboardPage() {
  const { 
    user, 
    token, 
    transactions, 
    loans, 
    subscriptions, 
    investments, 
    loading, 
    selectedBank, 
    setSelectedBank,
    linkBankAccount,
    linkUpiAccount,
    addTransaction
  } = useApp();

  // Onboarding state variables
  const [bankName, setBankName] = useState('HDFC');
  const [bankType, setBankType] = useState('Savings');
  const [initialBalance, setInitialBalance] = useState(25000);
  const [linkingBank, setLinkingBank] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [upiBank, setUpiBank] = useState('');
  const [linkingUpi, setLinkingUpi] = useState(false);

  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState(450);
  const [addingTx, setAddingTx] = useState(false);

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <span className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-xs tracking-wider animate-pulse uppercase">Decrypting Ledger Feeds...</p>
      </div>
    );
  }

  const banksList = user?.banks || [];
  const transactionsList = transactions || [];
  const loansList = loans || [];
  const investmentsList = investments || [];
  const subscriptionsList = subscriptions || [];
  const linkedUpiIds = user?.linkedUpiIds || [];

  // Determine state level
  const isNewUser = banksList.length === 0;
  const isPartialData = banksList.length > 0 && (linkedUpiIds.length === 0 || transactionsList.length < 3);

  // Onboarding handlers
  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkingBank(true);
    try {
      await linkBankAccount(bankName, bankType, initialBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingBank(false);
    }
  };

  const handleLinkUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkingUpi(true);
    try {
      const targetBank = upiBank || (banksList[0]?.bankName || 'HDFC');
      const baseId = (user.name || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      const finalUpi = upiId || `${baseId}@ok${targetBank.toLowerCase()}`;
      await linkUpiAccount(finalUpi, targetBank);
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingUpi(false);
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTx(true);
    try {
      const targetBank = banksList[0]?.bankName || 'HDFC';
      const activeUpi = linkedUpiIds[0];
      await addTransaction({
        title: txTitle || 'Starbucks Coffee',
        amount: txAmount,
        category: txCategory,
        type: txType,
        date: new Date().toISOString(),
        paymentMode: linkedUpiIds.length > 0 ? 'UPI' : 'Bank',
        upiId: activeUpi || undefined,
        bankName: activeUpi
          ? (banksList.find(b => activeUpi.toLowerCase().includes(b.bankName.toLowerCase()))?.bankName || targetBank)
          : targetBank
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTx(false);
      setTxTitle('');
    }
  };

  // Filtered lists depending on selected bank
  const filteredBanks = selectedBank === 'all'
    ? banksList
    : banksList.filter(b => b.bankName === selectedBank);

  const filteredTransactions = selectedBank === 'all'
    ? transactionsList
    : transactionsList.filter(t => t.bankName === selectedBank || (t.paymentMode === 'UPI' && selectedBank === 'SBI' && t.upiId?.includes('sbi')) || (t.paymentMode === 'UPI' && selectedBank === 'HDFC' && t.upiId?.includes('hdfc')));

  const filteredLoans = selectedBank === 'all'
    ? loansList
    : loansList.filter(l => l.bankName === selectedBank);

  // Calculate totals
  const totalBalance = filteredBanks.reduce((sum, b) => sum + b.balance, 0);
  const monthlyExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const savings = Math.max(0, monthlyIncome - monthlyExpense);
  const totalInvestments = investmentsList.reduce((sum, i) => sum + (i.currentPrice * i.quantity), 0);
  
  // Calculate active EMI sum
  const activeEmisSum = filteredLoans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.emiAmount, 0);

  // Group transactions for charts
  const chartData = [
    { name: 'Week 1', Income: monthlyIncome > 0 ? Math.round(monthlyIncome * 0.7) : 84900, Expenses: monthlyExpense > 0 ? Math.round(monthlyExpense * 0.3) : 15800 },
    { name: 'Week 2', Income: 0, Expenses: monthlyExpense > 0 ? Math.round(monthlyExpense * 0.2) : 12500 },
    { name: 'Week 3', Income: 0, Expenses: monthlyExpense > 0 ? Math.round(monthlyExpense * 0.3) : 16900 },
    { name: 'Week 4', Income: monthlyIncome > 0 ? Math.round(monthlyIncome * 0.3) : 4500, Expenses: monthlyExpense > 0 ? Math.round(monthlyExpense * 0.2) : 9200 }
  ];

  // Category summary pie chart data
  const categories: Record<string, number> = {};
  filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));
  const COLORS = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  // AI insights triggers
  const unusedSubs = subscriptionsList.filter(s => s.usageFrequency === 'low' && s.status === 'active');
  const totalWastedSubs = unusedSubs.reduce((sum, s) => sum + s.cost, 0);

  // Onboarding progress
  const onboardingSteps = [
    { title: 'Connect a Bank Account', completed: banksList.length > 0 },
    { title: 'Verify a UPI ID', completed: linkedUpiIds.length > 0 },
    { title: 'Log First Transaction', completed: transactionsList.length > 0 }
  ];
  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedSteps / onboardingSteps.length) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 bg-slate-50 text-slate-800">
      
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/80 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            {user.name ? `Welcome, ${user.name}` : 'Welcome to SpendSense'}
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">Overview of your bank ledgers, Groww investments, and AI analyses</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bank Account Selector Filter */}
          {!isNewUser && (
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:border-slate-300 transition-colors shadow-sm">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Bank:</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 font-bold cursor-pointer font-sans focus:ring-0"
              >
                <option value="all">All Accounts</option>
                {banksList.map((b) => (
                  <option key={b.bankName} value={b.bankName}>
                    {b.bankName} ({b.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
          <NotificationDrawer />
          {!isNewUser && (
            <Link
              href="/transactions"
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-purple-500/10 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </Link>
          )}
        </div>
      </div>

      {/* Partial Data Notice Banner */}
      {isPartialData && (
        <div className="flex items-start md:items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div>
              <strong className="font-semibold">Partial Financial Profile:</strong> Link a UPI handle and upload/add at least 3 transactions to activate the full AI predictive forecasting engines.
            </div>
            <div className="flex gap-2">
              {linkedUpiIds.length === 0 && (
                <Link href="/upi?next=/transactions" className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors">
                  Link UPI ID
                </Link>
              )}
              {transactionsList.length < 3 && (
                <Link href="/transactions" className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-medium transition-colors">
                  Import Ledger
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW USER STATE: ONBOARDING FLOW */}
      {isNewUser ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Onboarding Progress Dashboard */}
          <GlassCard glowColor="purple" className="bg-white/90 border-slate-200/80 shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-[10px] text-purple-600 uppercase tracking-widest font-mono font-bold">Personalized AI Financial Setup</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Get Started with SpendSense AI</h3>
                <p className="text-xs text-slate-500 mt-1">Connect your banking details to populate analytical models, loan tracking, and Gemini advice cards.</p>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Onboarding Completion</span>
                  <span className="text-purple-600">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* STEP 1: Bank link */}
            <GlassCard glowColor={banksList.length > 0 ? 'green' : 'purple'} className={`flex flex-col justify-between h-auto ${banksList.length > 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">1</span>
                    <h4 className="text-sm font-bold text-slate-900">Connect a Bank</h4>
                  </div>
                  {banksList.length > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="text-[9px] font-semibold text-purple-600 uppercase font-mono bg-purple-50 px-2 py-0.5 rounded">Required</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-6">Link a simulated bank account to store funds, make transfers, and establish your credit score.</p>
                
                {banksList.length > 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5 text-xs text-emerald-900">
                    <div className="flex justify-between font-semibold">
                      <span>{banksList[0].bankName} ({banksList[0].accountType})</span>
                      <span>₹{banksList[0].balance.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">Acc: {banksList[0].accountNumber}</div>
                  </div>
                ) : (
                  <form onSubmit={handleLinkBank} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Select Institution</label>
                      <select 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="HDFC">HDFC Bank</option>
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Account Type</label>
                        <select 
                          value={bankType}
                          onChange={(e) => setBankType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="Savings">Savings</option>
                          <option value="Current">Current</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Starting Balance (₹)</label>
                        <input 
                          type="number" 
                          value={initialBalance}
                          onChange={(e) => setInitialBalance(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={linkingBank}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {linkingBank ? 'Linking Account...' : 'Link Bank Account'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </GlassCard>

            {/* STEP 2: UPI link */}
            <GlassCard glowColor={linkedUpiIds.length > 0 ? 'green' : 'purple'} className={`flex flex-col justify-between h-auto ${linkedUpiIds.length > 0 ? 'bg-slate-50/50' : 'bg-white'}`} id="link-upi-section">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">2</span>
                    <h4 className="text-sm font-bold text-slate-900">Verify a UPI ID</h4>
                  </div>
                  {linkedUpiIds.length > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-6">Create a UPI handles virtual address for mobile transactions. Requires at least one connected bank account.</p>
                
                {linkedUpiIds.length > 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1 text-xs text-emerald-900">
                    <div className="font-semibold">Linked UPI Address:</div>
                    <div className="text-[11px] font-mono text-emerald-700">{linkedUpiIds[0]}</div>
                  </div>
                ) : (
                  <fieldset disabled={banksList.length === 0} className="space-y-3.5 disabled:opacity-40">
                    <form onSubmit={handleLinkUpi} className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Select Bank Account</label>
                        <select 
                          value={upiBank}
                          onChange={(e) => setUpiBank(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                        >
                          {banksList.map((b) => (
                            <option key={b.bankName} value={b.bankName}>{b.bankName}</option>
                          ))}
                          {banksList.length === 0 && <option value="">No Bank Linked</option>}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Enter UPI ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. yourname@oksbi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={linkingUpi || banksList.length === 0}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {linkingUpi ? 'Verifying...' : 'Link UPI Handle'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </fieldset>
                )}
              </div>
            </GlassCard>

            {/* STEP 3: First Ledger */}
            <GlassCard glowColor={transactionsList.length > 0 ? 'green' : 'purple'} className={`flex flex-col justify-between h-auto ${transactionsList.length > 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">3</span>
                    <h4 className="text-sm font-bold text-slate-900">Add First Transaction</h4>
                  </div>
                  {transactionsList.length > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-6">Log an income or expense transaction manually to begin generating cash-flow graphs.</p>
                
                {transactionsList.length > 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5 text-xs text-emerald-900">
                    <div className="flex justify-between font-semibold">
                      <span>{transactionsList[0].title}</span>
                      <span className={transactionsList[0].type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                        {transactionsList[0].type === 'income' ? '+' : '-'}₹{transactionsList[0].amount}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700">Category: {transactionsList[0].category}</div>
                  </div>
                ) : (
                  <fieldset disabled={banksList.length === 0} className="space-y-3.5 disabled:opacity-40">
                    <form onSubmit={handleAddTx} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Item Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Starbucks"
                            value={txTitle}
                            onChange={(e) => setTxTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Category</label>
                          <select 
                            value={txCategory}
                            onChange={(e) => setTxCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                          >
                            <option value="Food">Food</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Salary">Salary</option>
                            <option value="Rent">Rent</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Utilities">Utilities</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Flow Type</label>
                          <select 
                            value={txType}
                            onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                          >
                            <option value="expense">Expense (-)</option>
                            <option value="income">Income (+)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Amount (₹)</label>
                          <input 
                            type="number" 
                            value={txAmount}
                            onChange={(e) => setTxAmount(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        disabled={addingTx || banksList.length === 0}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {addingTx ? 'Adding...' : 'Log Transaction'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </fieldset>
                )}
              </div>
            </GlassCard>

          </div>

          {/* Locked Features / Benefits Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100/50 p-6 rounded-3xl border border-slate-200/60">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Gemini AI Integrations</span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">Unlock Your Intelligent Financial Ecosystem</h4>
              <p className="text-xs text-slate-500 mt-2">SpendSense AI reads HDFC/SBI bank statements and predicts next-month budget caps. Complete step 1 to link your first account and activate these modules:</p>
              
              <ul className="space-y-3.5 mt-5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>AI Monthly Analytics Reports:</strong> Fully detailed Gemini PDF analyses.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>Investment Tracking:</strong> Connect Groww stocks & mutual funds.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>OTT Subscriptions Wastage:</strong> Find and cancel unused plans.</span>
                </li>
              </ul>
            </div>
            <div className="relative border border-slate-200/80 rounded-2xl bg-white p-5 flex flex-col justify-center items-center text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-slate-800 text-sm">Awaiting First Banking Link</h5>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Predictions, health indices, and recurring loan payoff trackers are locked until a bank ledger is configured.</p>
            </div>
          </div>
        </div>
      ) : (
        /* FULL STATE & PARTIAL STATE LAYOUT */
        <div className="space-y-8 animate-fadeIn">
          {/* Report System: Current Analysis Period & Timeline */}
          <DashboardReportSection />

          {/* Main Metrics Row (Total Balance, Spending, Savings, Groww) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Balance Card */}
            <GlassCard glowColor="purple">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Total Net Balance</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                ₹{totalBalance.toLocaleString('en-IN')}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span>Linked accounts:</span>
                <span className="text-purple-600 font-semibold">{banksList.length} bank(s)</span>
              </div>
            </GlassCard>

            {/* Expenses Card */}
            <GlassCard glowColor="blue">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Monthly Outflow</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <ArrowUpRight className="w-4.5 h-4.5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                ₹{monthlyExpense.toLocaleString('en-IN')}
              </h3>
              <div className="flex items-center gap-1 text-xs text-rose-500 mt-2">
                <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
                <span>+12.4% from last month</span>
              </div>
            </GlassCard>

            {/* Savings Card */}
            <GlassCard glowColor="green">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Savings Yield</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ArrowDownRight className="w-4.5 h-4.5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                ₹{savings.toLocaleString('en-IN')}
              </h3>
              <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2">
                <ArrowDownRight className="w-4.5 h-4.5 shrink-0" />
                <span>{monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0}% Savings margin</span>
              </div>
            </GlassCard>

            {/* Groww Card */}
            <GlassCard glowColor="none">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Groww Portfolio</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                ₹{totalInvestments.toLocaleString('en-IN')}
              </h3>
              <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2">
                <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
                <span>Net profit: +14.8%</span>
              </div>
            </GlassCard>
          </div>

          {/* Charts & Interactive Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Income vs Expenses Area Chart (Left 2 cols) */}
            <div className="lg:col-span-2">
              <GlassCard className="h-[380px] flex flex-col justify-between bg-white border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Income vs Expense Ledger</h4>
                    <p className="text-[10px] text-slate-500">Real-time combined statements for linked banks</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Income</span>
                    <span className="flex items-center gap-1.5 text-purple-600"><span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Expenses</span>
                  </div>
                </div>
                
                {transactionsList.length < 3 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                    <h5 className="font-semibold text-slate-800 text-xs">Insufficient Transaction History</h5>
                    <p className="text-[11px] text-slate-500 max-w-sm mt-1">We require at least 3 transactions to display comparative line analysis. Link a bank statement or add mock ledgers below.</p>
                  </div>
                ) : (
                  <div className="flex-1 w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '11px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                        <Area type="monotone" dataKey="Income" stroke="#2563eb" fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="Expenses" stroke="#7c3aed" fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Credit score simulated progress circular card (Right col) */}
            <div>
              <GlassCard className="h-[380px] flex flex-col justify-between items-center text-center bg-white border-slate-200/80 shadow-sm">
                <div className="w-full text-left">
                  <h4 className="text-sm font-bold text-slate-900">SpendSense Health Index</h4>
                  <p className="text-[10px] text-slate-500">Calculated credit risk simulator</p>
                </div>

                {/* Glowing Ring Visualizer */}
                <div className="relative w-44 h-44 flex items-center justify-center my-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="88" cy="88" r="74" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                    <circle 
                      cx="88" 
                      cy="88" 
                      r="74" 
                      stroke="url(#purpleGlow)" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray="465"
                      strokeDashoffset={465 - (465 * (user.creditScore || 300)) / 900}
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{user.creditScore || 750}</span>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-600 mt-1">Excellent</span>
                  </div>
                </div>

                {/* Quick insights tip */}
                <div className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-[11px] text-slate-600">
                  <span className="text-slate-900 font-semibold">AI Insights:</span> Your score holds at <span className="text-emerald-600 font-semibold">{user.creditScore || 750}</span>. Consistently file taxes and settle EMIs to maintain status.
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Bottom Section: AI Advisor Widgets, Loans and Bills summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Floating AI Recommendations (Col 1) */}
            <GlassCard glowColor="purple" className="flex flex-col justify-between bg-white border-slate-200/80 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Gemini Advisor Cards</h4>
                </div>
                
                <div className="space-y-3.5 mt-4">
                  {totalWastedSubs > 0 ? (
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Subscription Leakage
                      </div>
                      You have unused subscription plans wasting **₹{totalWastedSubs}** this month. Turn off auto-renewals in subscriptions.
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
                        <ShieldCheck className="w-4 h-4" />
                        Zero Subscription Wastage
                      </div>
                      All monitored OTT channels report high usage frequency rates. Keep it up!
                    </div>
                  )}
                  
                  {banksList.length > 0 && (
                    <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                        <CreditCard className="w-4 h-4" />
                        Credit Limit Caps
                      </div>
                      Your HDFC/SBI balance is healthy. Keep weekly credit transactions under ₹15,000 to maximize savings interest.
                    </div>
                  )}
                </div>
              </div>
              
              <Link 
                href="/reports" 
                className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-4 border border-slate-200/80 hover:bg-slate-50 rounded-xl text-xs text-slate-600 hover:text-slate-900 transition-all font-semibold cursor-pointer shadow-sm"
              >
                Review Monthly Reports
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>

            {/* Loans Tracker summary (Col 2) */}
            <GlassCard className="flex flex-col justify-between bg-white border-slate-200/80 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Coins className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Active Debt Strain</h4>
                </div>

                {loansList.length === 0 ? (
                  <div className="flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mt-4">
                    <span className="text-[10px] text-slate-400">No loans logged. Add EMI schedules under Debt Center.</span>
                  </div>
                ) : (
                  <div className="space-y-4 mt-5">
                    {loansList.slice(0, 2).map((loan) => {
                      const percent = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100);
                      return (
                        <div key={loan.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800">{loan.loanName} ({loan.bankName})</span>
                            <span className="text-slate-500">{percent}% Settled</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Paid: ₹{(loan.totalAmount - loan.remainingAmount).toLocaleString()}</span>
                            <span>Left: ₹{loan.remainingAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-5 pt-3 border-t border-slate-100">
                <span>EMI Commit: <strong className="text-slate-800">₹{activeEmisSum.toLocaleString()}</strong></span>
                <Link href="/loans" className="text-purple-600 hover:underline flex items-center gap-0.5 font-semibold">
                  Debt Center <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>

            {/* Streaming & Bills reminders (Col 3) */}
            <GlassCard className="flex flex-col justify-between bg-white border-slate-200/80 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                    <Tv className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Upcoming Renewals</h4>
                </div>

                {subscriptionsList.length === 0 ? (
                  <div className="flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mt-4">
                    <span className="text-[10px] text-slate-400">No active subscriptions monitored. Link OTT logs.</span>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {subscriptionsList.slice(0, 3).map((sub) => (
                      <div key={sub.id} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          <div>
                            <h5 className="text-xs font-semibold text-slate-800">{sub.name}</h5>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              Due: {new Date(sub.nextBillingDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-800 font-mono">₹{sub.cost}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/subscriptions"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-4 border border-slate-200/80 hover:bg-slate-50 rounded-xl text-xs text-slate-600 hover:text-slate-900 transition-all font-semibold cursor-pointer shadow-sm"
              >
                Audit Subscriptions
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>
          </div>
        </div>
      )}

    </div>
  );
}
