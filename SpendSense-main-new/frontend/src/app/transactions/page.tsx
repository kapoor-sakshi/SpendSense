'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ArrowUpDown, Plus, X, Trash2, ChevronDown,
  TrendingUp, TrendingDown, Wallet, Hash,
  Coffee, Home, Briefcase, Film, Smartphone, Fuel, ShoppingBag, BarChart3, HelpCircle,
  CreditCard, Banknote, CircleDollarSign,
  FileDown, FileSpreadsheet, StickyNote, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { inferBankFromUpiId } from '../../utils/transactionDeduplication';
import { GlassCard } from '../../components/GlassCard';
import { exportToExcel, exportToPDF } from '../../utils/exports';

/* ─────────────────────── helpers ─────────────────────── */

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const CATEGORIES = ['All', 'Food', 'Rent', 'Salary', 'Entertainment', 'Recharge', 'Fuel', 'Shopping', 'Investments', 'Others'] as const;
const TYPES = ['All', 'Income', 'Expense'] as const;
const PAY_MODES = ['All', 'UPI', 'Bank', 'Cash'] as const;

const categoryMeta: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Food:          { icon: <Coffee size={14} />,       color: 'text-orange-600',  bg: 'bg-orange-50 border border-orange-100' },
  Rent:          { icon: <Home size={14} />,         color: 'text-blue-600',    bg: 'bg-blue-50 border border-blue-100' },
  Salary:        { icon: <Briefcase size={14} />,    color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
  Entertainment: { icon: <Film size={14} />,         color: 'text-pink-600',    bg: 'bg-pink-50 border border-pink-100' },
  Recharge:      { icon: <Smartphone size={14} />,   color: 'text-cyan-600',    bg: 'bg-cyan-50 border border-cyan-100' },
  Fuel:          { icon: <Fuel size={14} />,         color: 'text-amber-600',   bg: 'bg-amber-50 border border-amber-100' },
  Shopping:      { icon: <ShoppingBag size={14} />,  color: 'text-violet-600',  bg: 'bg-violet-50 border border-violet-100' },
  Investments:   { icon: <BarChart3 size={14} />,    color: 'text-teal-600',    bg: 'bg-teal-50 border border-teal-100' },
  Others:        { icon: <HelpCircle size={14} />,   color: 'text-slate-600',   bg: 'bg-slate-50 border border-slate-200' },
};

const payModeBadge: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  UPI:  { icon: <CircleDollarSign size={12} />, label: 'UPI',  cls: 'bg-purple-50 text-purple-600 border border-purple-100' },
  Bank: { icon: <CreditCard size={12} />,       label: 'Bank', cls: 'bg-blue-50 text-blue-600 border border-blue-100' },
  Cash: { icon: <Banknote size={12} />,         label: 'Cash', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
};

/* ─────────────────── animated counter ─────────────────── */

function AnimatedCounter({ value, prefix = '₹' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 600;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = end / steps;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  if (prefix === '#') return <span>{display}</span>;
  return <span>{prefix}{display.toLocaleString('en-IN')}</span>;
}

/* ─────────────── custom select dropdown ─────────────── */

function SelectDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200
                   hover:border-purple-500 text-slate-700 text-sm transition-all min-w-[120px] justify-between shadow-sm cursor-pointer"
      >
        <span className="text-slate-400 text-xs mr-1">{label}:</span>
        <span className="font-semibold">{value}</span>
        <ChevronDown size={14} className={`transition-transform text-slate-400 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1 w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer
                  ${value === opt ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════ MAIN PAGE COMPONENT ══════════════════ */

export default function TransactionsPage() {
  const { user, transactions, addTransaction, deleteTransaction, uploadBankStatement } = useApp();

  /* ── filters ── */
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [payModeFilter, setPayModeFilter] = useState<string>('All');
  const [sortNewest, setSortNewest] = useState(true);

  /* ── add‐form state ── */
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formPayMode, setFormPayMode] = useState<'UPI' | 'Bank' | 'Cash'>('UPI');
  const [formBank, setFormBank] = useState('');
  const [formUpi, setFormUpi] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  /* ── statement import state ── */
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [importBank, setImportBank] = useState((user?.banks || [])[0]?.bankName || '');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  /* ── delete confirm ── */
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ── computed ── */
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const netBalance = totalIncome - totalExpense;

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== 'All') list = list.filter(t => t.category === categoryFilter);
    if (typeFilter !== 'All') list = list.filter(t => t.type === typeFilter.toLowerCase());
    if (payModeFilter !== 'All') list = list.filter(t => t.paymentMode === payModeFilter);

    list.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortNewest ? db - da : da - db;
    });

    return list;
  }, [transactions, search, categoryFilter, typeFilter, payModeFilter, sortNewest]);

  /* ── submit handler ── */
  const handleAdd = useCallback(async () => {
    if (!formTitle.trim() || !formAmount.trim()) return;
    if (formPayMode === 'UPI' && !(formUpi || user.linkedUpiIds?.[0])) return;
    if (formPayMode === 'Bank' && !formBank && !user.banks?.[0]?.bankName) return;
    setFormSubmitting(true);
    try {
      const activeUpi = formUpi || user.linkedUpiIds?.[0] || '';
      const upiBankName = activeUpi
        ? (user.banks.find(b => activeUpi.toLowerCase().includes(b.bankName.toLowerCase()))?.bankName
          || inferBankFromUpiId(activeUpi)
          || user.banks[0]?.bankName)
        : undefined;

      await addTransaction({
        amount: parseFloat(formAmount),
        title: formTitle.trim(),
        category: formCategory,
        date: new Date().toISOString(),
        type: formType,
        paymentMode: formPayMode,
        ...(formPayMode === 'UPI' && activeUpi ? { upiId: activeUpi, bankName: upiBankName } : {}),
        ...(formPayMode === 'Bank' && formBank ? { bankName: formBank } : {}),
        ...(formNotes.trim() ? { notes: formNotes.trim() } : {}),
      });
      setFormTitle(''); setFormAmount(''); setFormCategory('Food');
      setFormType('expense'); setFormPayMode('UPI'); setFormBank('');
      setFormUpi(''); setFormNotes(''); setShowForm(false);
    } finally {
      setFormSubmitting(false);
    }
  }, [formTitle, formAmount, formCategory, formType, formPayMode, formUpi, formBank, formNotes, addTransaction, user.banks]);

  /* ── delete handler ── */
  const handleDelete = useCallback(async (id: string) => {
    await deleteTransaction(id);
    setDeleteId(null);
  }, [deleteTransaction]);

  /* ── statement import handler ── */
  const handleImportStatement = useCallback(async () => {
    if (!importBank || !importFile) return;
    setImportLoading(true);
    setImportSuccess(false);
    setImportError('');
    setImportStatus('Uploading');
    try {
      const result = await uploadBankStatement(importBank, importFile, (status) => {
        setImportStatus(status);
      });
      if (result?.duplicate) {
        setImportError(result.message || 'This statement was already processed.');
        return;
      }
      if (result?.success === false || (result?.addedCount === 0 && !result?.message?.includes('successfully'))) {
        setImportError(result?.message || 'No transaction table detected in uploaded statement.');
        return;
      }
      setImportSuccess(true);
      setTimeout(() => {
        setShowStatementModal(false);
        setImportSuccess(false);
        setImportFile(null);
        setImportStatus('');
        setImportError('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setImportError('Statement processing failed. Please try again.');
    } finally {
      setImportLoading(false);
    }
  }, [importBank, importFile, uploadBankStatement]);

  /* ── export handlers ── */
  const handleExportExcel = () => exportToExcel(filtered);
  const handleExportPDF = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const categories: Record<string, number> = {};
    expenses.forEach(t => { categories[t.category] = (categories[t.category] || 0) + t.amount; });
    let highestCat = 'Others';
    let highestAmt = 0;
    Object.entries(categories).forEach(([cat, amt]) => { if (amt > highestAmt) { highestAmt = amt; highestCat = cat; } });

    exportToPDF(filtered, {
      financialSummary: `You earned ${fmt(totalIncome)} and spent ${fmt(totalExp)} this period. Your highest expense category was "${highestCat}" at ${fmt(highestAmt)}.`,
      highestSpendingCategory: highestCat,
      savingsAmount: Math.max(0, totalIncome - totalExp),
      emiBurdenPercentage: totalIncome > 0 ? Math.round((0 / totalIncome) * 100) : 0,
      subscriptionWasteAmount: 0,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ──────── HEADER ──────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transaction Center
            </h1>
            <p className="mt-1 text-slate-500 text-xs">
              Track, filter, and manage every rupee — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatementModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-xs font-semibold shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <FileSpreadsheet size={14} /> Import Statement
            </button>
          </div>
        </motion.div>

        {/* ──────── SUMMARY CARDS ──────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Income',      value: totalIncome,           icon: <TrendingUp size={18} />,    glow: 'green'  as const, accent: 'text-emerald-600', border: 'border-slate-200/60' },
            { label: 'Total Expenses',     value: totalExpense,          icon: <TrendingDown size={18} />,  glow: 'none'   as const, accent: 'text-rose-600',     border: 'border-slate-200/60' },
            { label: 'Net Balance',        value: netBalance,            icon: <Wallet size={18} />,        glow: 'purple' as const, accent: 'text-purple-600',  border: 'border-slate-200/60' },
            { label: 'Transactions',       value: transactions.length,   icon: <Hash size={18} />,          glow: 'blue'   as const, accent: 'text-blue-600',    border: 'border-slate-200/60', prefix: '#' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
            >
              <GlassCard glowColor={card.glow} className={`bg-white border-slate-200/80 p-5 shadow-sm`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-slate-500 text-xs font-medium">{card.label}</span>
                  <span className={`${card.accent}`}>{card.icon}</span>
                </div>
                <div className={`text-xl sm:text-2xl font-bold ${card.accent}`}>
                  <AnimatedCounter value={card.value} prefix={card.prefix ?? '₹'} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* ──────── FILTER BAR ──────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <GlassCard className="mb-6 p-4 bg-white border-slate-200/85 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200
                             text-slate-800 text-sm placeholder:text-slate-400 outline-none
                             focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* dropdowns */}
              <SelectDropdown label="Category" options={CATEGORIES} value={categoryFilter} onChange={setCategoryFilter} />
              <SelectDropdown label="Type" options={TYPES} value={typeFilter} onChange={setTypeFilter} />
              <SelectDropdown label="Mode" options={PAY_MODES} value={payModeFilter} onChange={setPayModeFilter} />

              {/* sort toggle */}
              <button
                onClick={() => setSortNewest(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200
                           hover:border-purple-500 text-slate-700 text-sm transition-all shadow-sm cursor-pointer font-semibold"
              >
                <ArrowUpDown size={14} className="text-slate-400" />
                {sortNewest ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* ──────── TRANSACTION TIMELINE LIST ──────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="space-y-3 mb-8"
        >
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-slate-400">
              <Filter size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-700 text-sm">No transactions found</p>
              <p className="text-xs mt-1">Adjust filters or link your statements to start analysis.</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {filtered.map((tx, idx) => {
              const meta = categoryMeta[tx.category] || categoryMeta['Others'];
              const badge = payModeBadge[tx.paymentMode] || payModeBadge['Cash'];
              const isIncome = tx.type === 'income';
              const dateStr = new Date(tx.date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              });
              const timeStr = new Date(tx.date).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.25 }}
                >
                  <GlassCard className="p-4 bg-white border-slate-200/80 group hover:border-purple-300 transition-all duration-300 shadow-sm
                                        hover:shadow-md hover:scale-[1.002]">
                    <div className="flex items-center gap-4">
                      {/* category icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </div>

                      {/* title + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{tx.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{dateStr} · {timeStr}</p>
                      </div>

                      {/* payment mode badge */}
                      <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </div>

                      {/* amount */}
                      <div className={`text-right font-bold text-sm sm:text-base whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{fmt(tx.amount)}
                      </div>

                      {/* delete */}
                      <div className="relative shrink-0">
                        {deleteId === tx.id ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1"
                          >
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Confirm delete"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50
                                       opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* notes row */}
                    {tx.notes && (
                      <div className="mt-2 ml-14 flex items-center gap-1.5 text-xs text-slate-500">
                        <StickyNote size={12} className="text-slate-400" />
                        <span className="truncate">{tx.notes}</span>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ──────── EXPORT BUTTONS ──────── */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="flex flex-wrap gap-3 justify-center mb-12"
          >
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700
                         text-white font-semibold text-sm shadow-md hover:shadow-purple-500/10 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <FileDown size={16} />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700
                         text-white font-semibold text-sm shadow-md hover:shadow-emerald-500/10 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </motion.div>
        )}
      </div>

      {/* ──────── FAB (Add Transaction) ──────── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full
                   bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 cursor-pointer"
      >
        <Plus size={26} />
      </motion.button>

      {/* ──────── ADD TRANSACTION MODAL ──────── */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />

            {/* modal panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                         z-50 w-auto sm:w-full sm:max-w-lg"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto text-slate-800">
                {/* modal header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Add Transaction
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* type toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-1">
                    {(['expense', 'income'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setFormType(t)}
                        className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer
                          ${formType === t
                            ? t === 'income'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-rose-600 text-white shadow-sm'
                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        {t === 'income' ? 'Income' : 'Expense'}
                      </button>
                    ))}
                  </div>

                  {/* title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Starbucks Coffee"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200
                                 text-slate-800 text-sm placeholder:text-slate-400 outline-none
                                 focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  {/* amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      min={0}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200
                                 text-slate-800 text-sm placeholder:text-slate-400 outline-none
                                 focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  {/* category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter(c => c !== 'All').map(cat => {
                        const m = categoryMeta[cat] || categoryMeta['Others'];
                        return (
                          <button
                            key={cat}
                            onClick={() => setFormCategory(cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                              ${formCategory === cat
                                ? `${m.bg} ${m.color} border-current shadow-sm`
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                              }`}
                          >
                            {m.icon}
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* payment mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Mode</label>
                    <div className="flex gap-2">
                      {(['UPI', 'Bank', 'Cash'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setFormPayMode(mode)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer
                            ${formPayMode === mode
                              ? payModeBadge[mode].cls + ' border-current shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          {payModeBadge[mode].icon}
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* bank / upi selector */}
                  {formPayMode === 'Bank' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Select Bank</label>
                      <div className="flex flex-wrap gap-2">
                        {(user.banks || []).map(b => (
                          <button
                            key={b.bankName}
                            onClick={() => setFormBank(b.bankName)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                              ${formBank === b.bankName
                                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-350'
                              }`}
                          >
                            {b.bankName} ({b.accountNumber})
                          </button>
                        ))}
                        {(user.banks || []).length === 0 && (
                          <p className="text-[10px] text-amber-600">No bank linked yet. Please link a bank account first.</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {formPayMode === 'UPI' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Select UPI ID</label>
                      <div className="flex flex-wrap gap-2">
                        {(user.linkedUpiIds || []).map(u => (
                          <button
                            key={u}
                            onClick={() => setFormUpi(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                              ${formUpi === u
                                ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-350'
                              }`}
                          >
                            {u}
                          </button>
                        ))}
                        {(user.linkedUpiIds || []).length === 0 && (
                          <p className="text-[10px] text-amber-600">No UPI handles linked yet. Please link a UPI handle first.</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes (optional)</label>
                    <textarea
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      rows={2}
                      placeholder="Any extra details..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200
                                 text-slate-800 text-sm placeholder:text-slate-400 outline-none
                                 focus:border-purple-500 focus:bg-white resize-none transition-colors shadow-inner"
                    />
                  </div>

                  {/* submit */}
                  <button
                    onClick={handleAdd}
                    disabled={!formTitle.trim() || !formAmount.trim() || formSubmitting}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700
                               text-white font-semibold text-sm shadow-md hover:shadow-purple-500/10
                               transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {formSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      `Add ${formType === 'income' ? 'Income' : 'Expense'}`
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ──────── STATEMENT IMPORT MODAL ──────── */}
      <AnimatePresence>
        {showStatementModal && (
          <>
            {/* overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatementModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />

            {/* modal panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                         z-50 w-auto sm:w-full sm:max-w-md"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800">
                {/* modal header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Import Bank Statement
                  </h2>
                  <button
                    onClick={() => setShowStatementModal(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* bank select */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Select Bank Account</label>
                    <div className="flex flex-wrap gap-2">
                      {(user.banks || []).map(b => (
                        <button
                          key={b.bankName}
                          onClick={() => setImportBank(b.bankName)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer
                            ${importBank === b.bankName
                              ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm font-bold'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-350'
                            }`}
                        >
                          {b.bankName} ({b.accountNumber})
                        </button>
                      ))}
                      {(user.banks || []).length === 0 && (
                        <p className="text-[10px] text-amber-600">No bank linked yet. Please link a bank account first.</p>
                      )}
                    </div>
                  </div>

                  {/* drag drop uploader */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Upload Statement File</label>
                    <div className="border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 hover:border-purple-300 transition-all cursor-pointer relative shadow-inner">
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.jpg,.jpeg,.png"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
                      {importFile ? (
                        <div className="text-center">
                          <p className="text-xs text-purple-600 font-semibold truncate max-w-[200px]">{importFile.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Drag & drop your bank statement here</p>
                          <p className="text-[10px] text-slate-400 mt-1">Accepts PDF, CSV, TXT, JPG, PNG</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* upload status pipeline */}
                  {importLoading && importStatus && (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {['Uploading', 'Reading PDF', 'Running OCR', 'Extracting Transactions', 'Analyzing', 'Completed'].map((step) => {
                        const steps = ['Uploading', 'Reading PDF', 'Running OCR', 'Extracting Transactions', 'Analyzing', 'Completed'];
                        const currentIdx = steps.indexOf(importStatus);
                        const stepIdx = steps.indexOf(step);
                        const isDone = stepIdx < currentIdx || importStatus === 'Completed';
                        const isActive = step === importStatus;
                        return (
                          <div key={step} className={`flex items-center gap-2 text-[11px] ${
                            isActive ? 'text-purple-700 font-bold' : isDone ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-purple-500 animate-pulse' : isDone ? 'bg-emerald-500' : 'bg-slate-300'
                            }`} />
                            {step}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      {importError}
                    </div>
                  )}

                  {/* submit */}
                  <button
                    onClick={handleImportStatement}
                    disabled={!importBank || !importFile || importLoading}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md hover:shadow-purple-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {importStatus || 'Processing'}...
                      </span>
                    ) : importSuccess ? (
                      <span className="flex items-center justify-center gap-1.5 text-emerald-600">
                        <Check size={16} /> Statement Processed!
                      </span>
                    ) : (
                      'Verify & Sync Statement'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
