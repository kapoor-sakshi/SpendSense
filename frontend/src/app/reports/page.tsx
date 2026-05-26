'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieChartIcon,
  CreditCard,
  Building,
  Layers,
  FileText,
  HelpCircle,
  FileDown,
  Lock,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';
import { exportToExcel, exportToPDF } from '../../utils/exports';

interface PredictionData {
  estimatedSpending: number;
  likelySavings: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  forecastData: Record<string, number>;
}

interface ReportData {
  financialSummary: string;
  highestSpendingCategory: string;
  savingsAmount: number;
  overspendingWarnings: string[];
  emiBurdenPercentage: number;
  subscriptionWasteAmount: number;
  futurePredictions: Record<string, number>;
  suggestions: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const formatCurrency = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function ReportsPage() {
  const {
    token,
    backendConnected,
    transactions,
    user,
    loans,
    insurance,
    investments,
    subscriptions,
    generateAIReport
  } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Decrypting ledger feeds...');
  const [report, setReport] = useState<ReportData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'predictions'>('monthly');

  const hasSufficientData = transactions.length >= 3;

  // Load predictions and reports
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const steps = [
        'Decrypting ledger feeds...',
        'Analyzing discretionary outflow vectors...',
        'Gemini parsing financial risk scores...',
        'Finalizing predictions...'
      ];
      
      let stepIndex = 0;
      setLoadingStep(steps[0]);
      
      const stepInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setLoadingStep(steps[stepIndex]);
        }
      }, 600);

      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Start report generation
        const reportPromise = generateAIReport(currentMonth, currentYear);
        
        let predictionsData = null;
        if (backendConnected && token && hasSufficientData) {
          try {
            const res = await fetch(`${API_URL}/predictions`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              predictionsData = await res.json();
            }
          } catch (err) {
            console.warn('Backend predictions fetch failed, fallback to local simulate:', err);
          }
        }

        // Wait at least 2.5 seconds total to display the realistic AI thinking screen
        await Promise.all([
          reportPromise,
          new Promise(resolve => setTimeout(resolve, 2500))
        ]).then(([reportResult]) => {
          setReport(reportResult);
          if (predictionsData) {
            setPredictions(predictionsData);
          } else {
            simulatePredictions();
          }
        });

      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        clearInterval(stepInterval);
        setLoading(false);
      }
    }

    fetchData();
  }, [backendConnected, token, transactions.length, loans.length, subscriptions.length]);

  // Offline prediction generator
  const simulatePredictions = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const emiTotal = loans.reduce((sum, l) => sum + l.emiAmount, 0);
    
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const estimatedSpending = Math.round(totalExpense * 0.94 + emiTotal);
    const likelySavings = Math.max(0, Math.round(totalIncome - estimatedSpending));
    const riskLevel = emiTotal / (totalIncome || 1) > 0.4 ? 'High' : (totalExpense > 40000 ? 'Medium' : 'Low');

    const forecastData: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      forecastData[cat] = Math.round(amt * 0.94);
    });

    setPredictions({
      estimatedSpending,
      likelySavings,
      riskLevel,
      forecastData
    });
  };

  // Historical trend mapping
  const getHistoricalAndForecastData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeline = [];
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mNum = d.getMonth() + 1;
      const yNum = d.getFullYear();

      const monthlyTx = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() + 1 === mNum && txDate.getFullYear() === yNum;
      });

      const income = monthlyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthlyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      timeline.push({
        name: months[d.getMonth()],
        income: income || (i === 0 ? 85000 : 80000 - i * 3000),
        expense: expense || (i === 0 ? 32000 : 38000 - i * 2000),
        forecastExpense: null,
        isForecast: false
      });
    }

    const nextD = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastItem = timeline[timeline.length - 1];

    timeline.push({
      name: months[nextD.getMonth()] + ' (Proj)',
      income: lastItem.income,
      expense: null,
      forecastExpense: hasSufficientData ? (predictions?.estimatedSpending || Math.round(lastItem.expense * 0.94)) : null,
      isForecast: true
    });

    return timeline;
  }, [transactions, predictions, hasSufficientData]);

  // Category actual vs projected spending
  const categoryChartData = useMemo(() => {
    if (!report || !predictions) return [];

    const categories = Array.from(new Set([
      ...Object.keys(report.futurePredictions || {}),
      ...Object.keys(predictions.forecastData || {}),
      'Food', 'Shopping', 'Utilities', 'Entertainment', 'Others'
    ])).slice(0, 6);

    return categories.map(cat => {
      const actual = transactions
        .filter(t => t.type === 'expense' && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);

      const predicted = predictions.forecastData[cat] || Math.round(actual * 0.92) || 1200;

      return {
        category: cat,
        Actual: actual || 1500,
        Projected: predicted
      };
    });
  }, [transactions, report, predictions]);

  // Channels allocations
  const financialChannels = useMemo(() => {
    const bankBreakdown: Record<string, number> = {};
    const upiBreakdown: Record<string, number> = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
      if (t.paymentMode === 'Bank' && t.bankName) {
        bankBreakdown[t.bankName] = (bankBreakdown[t.bankName] || 0) + t.amount;
      } else if (t.paymentMode === 'UPI' && t.upiId) {
        const domain = t.upiId.split('@')[1] || 'UPI';
        const formattedProvider = domain.replace('ok', '').toUpperCase();
        upiBreakdown[formattedProvider] = (upiBreakdown[formattedProvider] || 0) + t.amount;
      }
    });

    return {
      banks: Object.entries(bankBreakdown).map(([name, value]) => ({ name, value })),
      upis: Object.entries(upiBreakdown).map(([name, value]) => ({ name, value }))
    };
  }, [transactions]);

  const handleExportPDF = () => {
    if (!report) return;
    exportToPDF(transactions, {
      financialSummary: report.financialSummary,
      highestSpendingCategory: report.highestSpendingCategory,
      savingsAmount: report.savingsAmount,
      emiBurdenPercentage: report.emiBurdenPercentage,
      subscriptionWasteAmount: report.subscriptionWasteAmount
    });
  };

  const handleExportExcel = () => {
    exportToExcel(transactions);
  };

  const handleExportJSON = () => {
    const exportObj = {
      userData: {
        name: user.name,
        email: user.email,
        creditScore: user.creditScore,
        banks: user.banks,
        linkedUpiIds: user.linkedUpiIds
      },
      reportSummary: report,
      forecastPredictions: predictions,
      loansCount: loans.length,
      activeSubscriptions: subscriptions.length,
      investmentsCount: investments.length,
      insurancePoliciesCount: insurance.length,
      rawTransactions: transactions
    };

    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataUri);
    downloadAnchor.setAttribute('download', `SpendSense_AI_Financial_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const riskMeta = {
    Low: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', text: 'Low risk. Your debt and savings margins are optimal.' },
    Medium: { color: 'text-amber-700 bg-amber-50 border-amber-200', text: 'Moderate risk. EMI servicing or discretionary outflows are elevated.' },
    High: { color: 'text-red-700 bg-red-50 border-red-200', text: 'High risk alert! Debt EMIs represent over 40% of income limits.' }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-blue-200/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-purple-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                AI Reports & Predictions
              </h1>
            </div>
            <p className="text-slate-500 text-xs ml-1">
              Deep analytics, next month spending forecasts, and automated PDF/Excel statement builders.
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={!hasSufficientData || !report}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-purple-600" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!hasSufficientData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-blue-600" />
              Export Excel
            </button>
            <button
              onClick={handleExportJSON}
              disabled={!hasSufficientData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              JSON Data
            </button>
          </div>
        </div>

        {/* LOADING ANIMATED THINKING LOOPS SCREEN */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl shadow-sm text-center max-w-xl mx-auto space-y-6">
            <div className="relative flex items-center justify-center">
              <span className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-purple-600 absolute animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Gemini AI is analyzing...</h3>
              <div className="flex items-center justify-center gap-2 text-xs text-purple-600 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{loadingStep}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              We are querying transaction histories, evaluating outstanding EMI strains, and running predictive trend models on local servers.
            </p>
          </div>
        ) : !hasSufficientData ? (
          /* FORECAST BLOCKING SUFFICIENCY STATE */
          <div className="flex flex-col items-center justify-center py-20 px-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm text-center max-w-lg mx-auto space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-lg">Predictions Locked</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Connect more transaction endpoints or log manual ledgers to unlock predictive trends.
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 text-[11px] text-amber-800 rounded-xl max-w-xs leading-relaxed">
              SpendSense requires a minimum of <strong className="font-semibold">3 transactions</strong> to build forecast curves. Currently, you have logged: <span className="font-bold">{transactions.length}</span>.
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Setup Onboarding Profile
            </Link>
          </div>
        ) : (
          /* NORMAL ANALYTICAL REPORT DASHBOARD */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Core Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Projected Expense */}
              <GlassCard glowColor="purple">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-slate-500 text-xs font-medium">Estimated Next Month Spend</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(predictions?.estimatedSpending || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">EMIs + expected outflows</p>
              </GlassCard>

              {/* Likely Savings */}
              <GlassCard glowColor="green">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-slate-500 text-xs font-medium">Projected Savings</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(predictions?.likelySavings || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Expected net balance</p>
              </GlassCard>

              {/* Debt & EMI Burden */}
              <GlassCard glowColor="blue">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-slate-500 text-xs font-medium">EMI Debt Burden</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {report?.emiBurdenPercentage || 0}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Of total monthly income inflows</p>
              </GlassCard>

              {/* Subscription Waste */}
              <GlassCard glowColor="purple">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-slate-500 text-xs font-medium">Subscription Wastage</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(report?.subscriptionWasteAmount || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Low frequency services cost</p>
              </GlassCard>
            </div>

            {/* Risk Index */}
            {predictions && (
              <div className={`p-4 rounded-2xl border flex items-start gap-4 ${riskMeta[predictions.riskLevel].color} shadow-sm`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs">AI Financial Risk Index: {predictions.riskLevel}</h4>
                  <p className="text-[11px] opacity-90 mt-1">{riskMeta[predictions.riskLevel].text}</p>
                </div>
              </div>
            )}

            {/* Chart Curves (Two columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Income vs Expenses Forecast Curve */}
              <GlassCard className="bg-white border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h2 className="text-sm font-semibold text-slate-900">Income vs Expenses Forecast</h2>
                  </div>
                  <span className="text-[10px] text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full bg-slate-50">
                    Dashed line shows next-month forecast
                  </span>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getHistoricalAndForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                        formatter={(value: any, name: string) => {
                          if (value === null || value === undefined) return null;
                          const label = name === 'income' ? 'Income' : (name === 'expense' ? 'Actual Expense' : 'Forecast Expense');
                          return [formatCurrency(value), label];
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={32}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#incomeGrad)"
                        dot={{ r: 3, fill: '#10b981' }}
                        name="Income"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fill="url(#expenseGrad)"
                        dot={{ r: 3, fill: '#7c3aed' }}
                        connectNulls={false}
                        name="Actual Expense"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecastExpense"
                        stroke="#7c3aed"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#7c3aed' }}
                        connectNulls={true}
                        name="Forecast Expense"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Bar Chart: Category allocations vs Predictions */}
              <GlassCard className="bg-white border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Category Budgets vs Projections</h2>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                        formatter={(v: number) => [formatCurrency(v)]}
                      />
                      <Legend
                        verticalAlign="top"
                        height={32}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                      <Bar dataKey="Actual" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={25} />
                      <Bar dataKey="Projected" fill="#7c3aed" opacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            {/* Channels & Narrative Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Outflow breakdown details */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Banks breakdown */}
                <GlassCard className="bg-white border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-semibold text-slate-700">Outflows by Connected Banks</h3>
                  </div>
                  <div className="space-y-2">
                    {financialChannels.banks.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No bank statements or transactions logged.</p>
                    ) : (
                      financialChannels.banks.map((channel, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-medium">{channel.name} Account</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(channel.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>

                {/* UPI breakdown */}
                <GlassCard className="bg-white border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-semibold text-slate-700">Outflows by Linked UPI Domains</h3>
                  </div>
                  <div className="space-y-2">
                    {financialChannels.upis.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No UPI payments logged.</p>
                    ) : (
                      financialChannels.upis.map((channel, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-medium">@{channel.name.toLowerCase()} gateway</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(channel.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Narrative Summary card */}
              {report && (
                <div className="lg:col-span-2">
                  <GlassCard glowColor="purple" className="relative h-full overflow-hidden bg-white border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                      <h2 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        AI Counselor Report & Recommendations
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {/* Financial summary paragraph */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Narrative Report</h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono">
                          {report.financialSummary}
                        </p>
                      </div>

                      {/* Warnings / Anomaly detections */}
                      {report.overspendingWarnings && report.overspendingWarnings.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Flagged Warnings</h4>
                          <div className="space-y-2">
                            {report.overspendingWarnings.map((warning, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-sm">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions list */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Actionable Counsel Steps</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {report.suggestions.map((sug, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-150 p-3 rounded-xl hover:bg-slate-100/50 transition-colors">
                              <div className="w-5 h-5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
