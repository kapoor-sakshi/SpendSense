'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Landmark,
  TrendingDown,
  Percent,
  CalendarDays,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  BanknoteIcon,
  BadgeIndianRupee,
  Target,
  Brain,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/* ───────────────────── helpers ───────────────────── */

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const daysBetween = (dateStr: string) => {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const remainingColor = (remainPct: number) => {
  if (remainPct > 70) return { bar: 'from-rose-500 to-red-400', badge: 'text-rose-700 bg-rose-50 border-rose-200', label: 'High' };
  if (remainPct > 30) return { bar: 'from-amber-500 to-yellow-400', badge: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Moderate' };
  return { bar: 'from-emerald-500 to-green-400', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Low' };
};

/* ───────────────────── page ───────────────────────── */

export default function LoansPage() {
  const { loans, transactions, addLoan, loading } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  /* ── derived metrics ── */
  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);
  const totalDebt = useMemo(() => activeLoans.reduce((s, l) => s + l.remainingAmount, 0), [activeLoans]);
  const monthlyEmi = useMemo(() => activeLoans.reduce((s, l) => s + l.emiAmount, 0), [activeLoans]);
  const avgInterest = useMemo(() => {
    if (activeLoans.length === 0) return 0;
    return +(activeLoans.reduce((s, l) => s + l.interestRate, 0) / activeLoans.length).toFixed(2);
  }, [activeLoans]);

  /* ── chart data ── */
  const chartData = useMemo(
    () =>
      loans.map(l => ({
        name: l.loanName.length > 12 ? l.loanName.slice(0, 12) + '…' : l.loanName,
        Paid: l.totalAmount - l.remainingAmount,
        Remaining: l.remainingAmount,
      })),
    [loans],
  );

  /* ── AI insight ── */
  const aiInsight = useMemo(() => {
    const estimatedIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0) || 84900;
    const emiBurdenPct = estimatedIncome > 0 ? +((monthlyEmi / estimatedIncome) * 100).toFixed(1) : 0;
    const highestRateLoan = [...activeLoans].sort((a, b) => b.interestRate - a.interestRate)[0];

    const totalInterestEstimate = loans.reduce((s, l) => {
      const totalPaid = l.emiAmount * l.durationMonths;
      return s + Math.max(0, totalPaid - l.totalAmount);
    }, 0);

    return { emiBurdenPct, highestRateLoan, totalInterestEstimate, estimatedIncome };
  }, [activeLoans, loans, monthlyEmi, transactions]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <span className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-xs tracking-wider animate-pulse uppercase">Loading Debt Ledger…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 bg-slate-50 text-slate-800">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Loans &amp; EMI Tracker
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage your debts, track EMIs, and plan payoff schedules</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Outstanding Debt */}
        <GlassCard glowColor="purple">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Total Outstanding Debt</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{fmt(totalDebt)}</h3>
          <p className="text-xs text-slate-400 mt-2">
            Across <span className="text-purple-600 font-semibold">{activeLoans.length}</span> active loan(s)
          </p>
        </GlassCard>

        {/* Monthly EMI Burden */}
        <GlassCard glowColor="blue">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Monthly EMI Burden</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <BadgeIndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{fmt(monthlyEmi)}</h3>
          <p className="text-xs text-slate-400 mt-2">
            {aiInsight.emiBurdenPct}% of estimated income
          </p>
        </GlassCard>

        {/* Average Interest Rate */}
        <GlassCard glowColor="green">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Average Interest Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{avgInterest}%</h3>
          <p className="text-xs text-slate-400 mt-2">Weighted across active loans</p>
        </GlassCard>
      </div>

      {/* Loan Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-purple-600" /> Your Loans
        </h2>
        
        {loans.length === 0 ? (
          <div className="flex flex-col justify-center items-center text-center p-12 border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm max-w-xl mx-auto">
            <Landmark className="w-10 h-10 text-slate-400 mb-3" />
            <p className="font-semibold text-slate-800 text-sm">No loans added yet</p>
            <p className="text-xs text-slate-400 mt-1">Click Add Loan to start tracking EMIs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loans.map(loan => {
              const paidAmt = loan.totalAmount - loan.remainingAmount;
              const paidPct = Math.round((paidAmt / loan.totalAmount) * 100);
              const remainPct = 100 - paidPct;
              const colors = remainingColor(remainPct);
              const daysLeft = daysBetween(loan.nextEmiDate);
              const totalEmis = loan.durationMonths;

              return (
                <GlassCard key={loan.id} className="relative overflow-hidden bg-white border-slate-200/80 shadow-sm">
                  {/* Status */}
                  <div className="absolute top-4 right-4">
                    {loan.status === 'active' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-250 bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-slate-250 bg-slate-50 text-slate-500">
                        Closed
                      </span>
                    )}
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5 pr-20">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                      <Landmark className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{loan.loanName}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{loan.bankName}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-slate-500">{paidPct}% Paid</span>
                      <span className={`px-2 py-0.5 rounded-full border ${colors.badge} text-[9px]`}>{colors.label} Debt</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${paidPct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                      />
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Total Amount</span>
                      <span className="text-slate-800 font-bold">{fmt(loan.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Remaining</span>
                      <span className="text-slate-800 font-bold">{fmt(loan.remainingAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">EMI Amount</span>
                      <span className="text-slate-800 font-bold">{fmt(loan.emiAmount)}/mo</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Interest Rate</span>
                      <span className="text-slate-800 font-bold">{loan.interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Duration</span>
                      <span className="text-slate-800 font-bold">{loan.durationMonths} months</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">EMIs Paid</span>
                      <span className="text-slate-800 font-bold">{loan.paidEmis} / {totalEmis}</span>
                    </div>
                  </div>

                  {/* Next emi date */}
                  {loan.status === 'active' && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-150 shadow-inner">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        <span className="text-[11px] text-slate-600 font-semibold">
                          Next EMI:{' '}
                          <span className="text-slate-900 font-bold">
                            {new Date(loan.nextEmiDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          daysLeft <= 5
                            ? 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
                            : daysLeft <= 10
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                        {daysLeft}d left
                      </span>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* EMI Calendar */}
      <EMICalendar loans={activeLoans} />

      {/* Payoff overview bar charts */}
      {loans.length > 0 && (
        <GlassCard className="bg-white border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" /> Debt Payoff Overview
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Remaining vs Paid amounts per loan</p>
            </div>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="remainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '11px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                  formatter={(value: number) => [fmt(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Paid" fill="url(#paidGrad)" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar dataKey="Remaining" fill="url(#remainGrad)" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* AI Advice Card */}
      <GlassCard glowColor="purple" className="bg-white border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Debt Intelligence</h3>
            <p className="text-[10px] text-slate-400">SpendSense Gemini-powered analysis</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* EMI Burden */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
              <BanknoteIcon className="w-3.5 h-3.5" /> EMI Burden Analysis
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your monthly EMI outflow of <span className="text-slate-950 font-bold">{fmt(monthlyEmi)}</span> constitutes{' '}
              <span className={`font-bold ${aiInsight.emiBurdenPct > 40 ? 'text-rose-600' : aiInsight.emiBurdenPct > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {aiInsight.emiBurdenPct}%
              </span>{' '}
              of your estimated monthly income ({fmt(aiInsight.estimatedIncome)}).
              {aiInsight.emiBurdenPct > 40
                ? ' This is above the recommended 40% threshold — consider prepaying high interest debt.'
                : aiInsight.emiBurdenPct > 25
                ? ' This is within acceptable range but warrants monitoring as you add new commitments.'
                : ' This is well within healthy limits. You have good financial headroom.'}
            </p>
          </div>

          {/* Sug */}
          {aiInsight.highestRateLoan && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Prioritization Suggestion
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your <span className="text-slate-950 font-bold">{aiInsight.highestRateLoan.loanName}</span> from{' '}
                {aiInsight.highestRateLoan.bankName} carries the highest interest rate at{' '}
                <span className="text-amber-700 font-bold">{aiInsight.highestRateLoan.interestRate}% p.a.</span>
                {' '}Consider making principal prepayments on this. Prepaying even{' '}
                <span className="text-slate-900 font-bold">{fmt(Math.round(aiInsight.highestRateLoan.emiAmount * 0.5))}</span>{' '}
                extra monthly saves significant interest over time.
              </p>
            </div>
          )}

          {/* Interest estimation */}
          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Total Interest Forecast
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Based on current schedules, your estimated total interest paid across all loans is approximately{' '}
              <span className="text-purple-700 font-bold">{fmt(aiInsight.totalInterestEstimate)}</span>.
              {' '}Refinancing at even 0.5% lower rate could save you{' '}
              <span className="text-emerald-700 font-bold">
                {fmt(Math.round(aiInsight.totalInterestEstimate * 0.06))}
              </span>{' '}
              over the combined tenure.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Add Loan Modal */}
      <AnimatePresence>
        {showAddModal && <AddLoanModal onClose={() => setShowAddModal(false)} addLoan={addLoan} />}
      </AnimatePresence>
    </div>
  );
}

// calendar component
function EMICalendar({ loans }: { loans: { loanName: string; nextEmiDate: string; emiAmount: number; bankName: string }[] }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const monthName = baseDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const emiDays = useMemo(() => {
    const markers: Record<number, { loanName: string; emiAmount: number; bankName: string }[]> = {};
    loans.forEach(loan => {
      const emiDate = new Date(loan.nextEmiDate);
      const emiDayOfMonth = emiDate.getDate();
      for (let m = 0; m <= 3; m++) {
        const projDate = new Date(emiDate);
        projDate.setMonth(emiDate.getMonth() + m);
        if (projDate.getFullYear() === year && projDate.getMonth() === month) {
          const day = Math.min(emiDayOfMonth, daysInMonth);
          if (!markers[day]) markers[day] = [];
          markers[day].push({ loanName: loan.loanName, emiAmount: loan.emiAmount, bankName: loan.bankName });
        }
      }
    });
    return markers;
  }, [loans, year, month, daysInMonth]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <GlassCard className="bg-white border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" /> EMI Calendar
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Upcoming EMI due dates visualized</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset(o => Math.max(o - 1, 0))}
            disabled={monthOffset === 0}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-800 min-w-[120px] text-center">{monthName}</span>
          <button
            onClick={() => setMonthOffset(o => Math.min(o + 1, 2))}
            disabled={monthOffset >= 2}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1.5">
            {d}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEmi = emiDays[day];
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <div
              key={day}
              className={`relative h-14 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-0.5 group shadow-sm
                ${
                  hasEmi
                    ? 'border-purple-250 bg-purple-50 hover:bg-purple-100/50'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                } ${isToday ? 'ring-1 ring-blue-500' : ''}`}
            >
              <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : hasEmi ? 'text-purple-700' : 'text-slate-400'}`}>
                {day}
              </span>
              {hasEmi && (
                <>
                  <div className="flex gap-0.5">
                    {hasEmi.map((_, idx) => (
                      <span key={idx} className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    ))}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xl min-w-[160px] text-left">
                      {hasEmi.map((e, idx) => (
                        <div key={idx} className={`text-[10px] ${idx > 0 ? 'mt-1.5 pt-1.5 border-t border-slate-100' : ''}`}>
                          <span className="text-slate-800 font-bold block">{e.loanName}</span>
                          <span className="text-slate-400">{e.bankName} • </span>
                          <span className="text-purple-600 font-bold">{fmt(e.emiAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> EMI Due Date
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full ring-1 ring-blue-500 bg-transparent" /> Today
        </span>
      </div>
    </GlassCard>
  );
}

// Add Loan Modal Component
interface AddLoanModalProps {
  onClose: () => void;
  addLoan: (loan: {
    loanName: string;
    bankName: string;
    totalAmount: number;
    emiAmount: number;
    interestRate: number;
    durationMonths: number;
    nextEmiDate: string;
  }) => Promise<any>;
}

function AddLoanModal({ onClose, addLoan }: AddLoanModalProps) {
  const [form, setForm] = useState({
    loanName: '',
    bankName: '',
    totalAmount: '',
    emiAmount: '',
    interestRate: '',
    durationMonths: '',
    nextEmiDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.loanName || !form.bankName || !form.totalAmount || !form.emiAmount || !form.interestRate || !form.durationMonths || !form.nextEmiDate) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      await addLoan({
        loanName: form.loanName,
        bankName: form.bankName,
        totalAmount: parseFloat(form.totalAmount),
        emiAmount: parseFloat(form.emiAmount),
        interestRate: parseFloat(form.interestRate),
        durationMonths: parseInt(form.durationMonths),
        nextEmiDate: new Date(form.nextEmiDate).toISOString(),
      });
      onClose();
    } catch {
      setError('Failed to add loan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Add New Loan</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">Loan Name</label>
              <input name="loanName" value={form.loanName} onChange={handleChange} placeholder="e.g. Home Loan" className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">Bank Name</label>
              <input name="bankName" value={form.bankName} onChange={handleChange} placeholder="e.g. HDFC Bank" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">Total Amount (₹)</label>
              <input name="totalAmount" type="number" value={form.totalAmount} onChange={handleChange} placeholder="500000" className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">EMI Amount (₹)</label>
              <input name="emiAmount" type="number" value={form.emiAmount} onChange={handleChange} placeholder="12000" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">Interest Rate (%)</label>
              <input name="interestRate" type="number" step="0.01" value={form.interestRate} onChange={handleChange} placeholder="9.5" className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">Duration (months)</label>
              <input name="durationMonths" type="number" value={form.durationMonths} onChange={handleChange} placeholder="48" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">Next EMI Date</label>
            <input name="nextEmiDate" type="date" value={form.nextEmiDate} onChange={handleChange} className={inputClass} />
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs text-slate-650 hover:text-slate-800 font-semibold transition-all cursor-pointer shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-750 disabled:bg-purple-600/50 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/45 border-t-white rounded-full animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Loan
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
