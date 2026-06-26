'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Database,
  Server,
  Users,
  Activity,
  Key,
  Trash2,
  RefreshCw,
  Download,
  Wifi,
  WifiOff,
  HardDrive,
  BarChart3,
  Landmark,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Globe,
  Lock,
  DatabaseZap,
  Layers,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/GlassCard';

// ─── Tab types ────────────────────────────────────────────────
type DataTab = 'transactions' | 'loans' | 'insurance' | 'investments' | 'subscriptions';

// ─── Stagger animation helpers ────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};

// ─── Notification icon helper ─────────────────────────────────
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    default:
      return <Info className="w-4 h-4 text-blue-600" />;
  }
}

function notifColor(type: string) {
  switch (type) {
    case 'success': return 'border-emerald-500/20 bg-emerald-500/10';
    case 'warning': return 'border-amber-500/20 bg-amber-500/10';
    case 'error':   return 'border-rose-500/20 bg-rose-500/10';
    default:        return 'border-blue-500/20 bg-blue-500/10';
  }
}

// ─── Credit Gauge SVG ─────────────────────────────────────────
function CreditGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 74;
  const progress = (score / 900) * circumference;
  const rating =
    score >= 750 ? 'Excellent' :
    score >= 650 ? 'Good' :
    score >= 550 ? 'Fair' : 'Poor';
  const ratingColor =
    score >= 750 ? 'text-emerald-600' :
    score >= 650 ? 'text-blue-600' :
    score >= 550 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="80" cy="80" r="74" stroke="rgba(15,23,42,0.06)" strokeWidth="8" fill="transparent" />
        <motion.circle
          cx="80"
          cy="80"
          r="74"
          stroke="url(#adminGaugeGrad)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="adminGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{score}</span>
        <span className={`text-[9px] uppercase font-mono tracking-widest mt-0.5 font-bold ${ratingColor}`}>{rating}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════
export default function AdminPage() {
  const {
    user,
    transactions,
    loans,
    insurance,
    investments,
    subscriptions,
    notifications,
    loading,
    backendConnected
  } = useApp();

  const [activeTab, setActiveTab] = useState<DataTab>('transactions');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // ── Computed values ──────────────────────────────────────────
  const totalDataPoints = useMemo(
    () =>
      transactions.length +
      loans.length +
      insurance.length +
      investments.length +
      subscriptions.length,
    [transactions, loans, insurance, investments, subscriptions]
  );

  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);
  const totalDebt = useMemo(() => activeLoans.reduce((s, l) => s + l.remainingAmount, 0), [activeLoans]);

  const activePolicies = useMemo(() => insurance.filter(i => i.status === 'active'), [insurance]);
  const totalCoverage = useMemo(() => activePolicies.reduce((s, i) => s + i.coverageAmount, 0), [activePolicies]);

  const portfolioValue = useMemo(
    () => investments.reduce((s, i) => s + i.currentPrice * i.quantity, 0),
    [investments]
  );
  const portfolioCost = useMemo(
    () => investments.reduce((s, i) => s + i.buyPrice * i.quantity, 0),
    [investments]
  );
  const portfolioPnL = portfolioValue - portfolioCost;

  const activeSubs = useMemo(() => subscriptions.filter(s => s.status === 'active'), [subscriptions]);
  const monthlySubsCost = useMemo(() => {
    return activeSubs.reduce((s, sub) => {
      if (sub.interval === 'Yearly') return s + sub.cost / 12;
      return s + sub.cost;
    }, 0);
  }, [activeSubs]);

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleClearData = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
      return;
    }
    const keys = [
      'spendsense_user', 'spendsense_tx', 'spendsense_loans',
      'spendsense_insurance', 'spendsense_investments', 'spendsense_subs',
      'spendsense_notifications'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    setClearConfirm(false);
    window.location.reload();
  };

  const handleResetDefaults = () => {
    const keys = [
      'spendsense_user', 'spendsense_tx', 'spendsense_loans',
      'spendsense_insurance', 'spendsense_investments', 'spendsense_subs',
      'spendsense_notifications'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user,
      transactions,
      loans,
      insurance,
      investments,
      subscriptions,
      notifications
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendsense_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-screen">
        <span className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-xs tracking-wider animate-pulse uppercase font-medium">
          Initializing Admin Console...
        </p>
      </div>
    );
  }

  // ── Tab definitions ──────────────────────────────────────────
  const tabConfig: { key: DataTab; label: string; icon: React.ReactNode }[] = [
    { key: 'transactions',  label: 'Transactions',  icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'loans',         label: 'Loans',          icon: <Landmark className="w-3.5 h-3.5" /> },
    { key: 'insurance',     label: 'Insurance',      icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { key: 'investments',   label: 'Investments',    icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'subscriptions', label: 'Subscriptions',  icon: <CreditCard className="w-3.5 h-3.5" /> },
  ];

  // ── System status card data ──────────────────────────────────
  const statusCards = [
    {
      label: 'Platform Status',
      value: 'Online',
      icon: <Activity className="w-4.5 h-4.5" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      glow: 'green' as const,
      extra: (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-600 font-mono font-semibold">All Systems Operational</span>
        </div>
      )
    },
    {
      label: 'Backend Connection',
      value: backendConnected ? 'Connected' : 'Offline',
      icon: backendConnected ? <Wifi className="w-4.5 h-4.5" /> : <WifiOff className="w-4.5 h-4.5" />,
      iconBg: backendConnected ? 'bg-blue-50' : 'bg-slate-100',
      iconColor: backendConnected ? 'text-blue-600' : 'text-slate-400',
      glow: backendConnected ? 'blue' as const : 'none' as const,
      extra: (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-blue-500' : 'bg-slate-400'}`} />
          <span className="text-[10px] text-slate-500 font-mono">
            {backendConnected ? 'Express + MongoDB' : 'Simulation Mode'}
          </span>
        </div>
      )
    },
    {
      label: 'Total Data Points',
      value: totalDataPoints.toLocaleString('en-IN'),
      icon: <Database className="w-4.5 h-4.5" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      glow: 'purple' as const,
      extra: (
        <div className="flex items-center gap-1.5 mt-2">
          <Layers className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-500 font-mono">
            Across {totalDataPoints > 0 ? 5 : 0} collections
          </span>
        </div>
      )
    },
    {
      label: 'Storage Mode',
      value: backendConnected ? 'API' : 'localStorage',
      icon: <HardDrive className="w-4.5 h-4.5" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      glow: 'none' as const,
      extra: (
        <div className="flex items-center gap-1.5 mt-2">
          <Server className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-500 font-mono">
            {backendConnected ? 'MongoDB Atlas' : 'Browser Storage'}
          </span>
        </div>
      )
    }
  ];

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <motion.div
      className="p-8 max-w-7xl mx-auto space-y-8 pb-20 bg-slate-50/30 min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600">
              Admin Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium">System Overview &amp; Controls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-[10px] text-purple-600 font-mono uppercase tracking-wider font-semibold">
            Admin Panel
          </span>
        </div>
      </motion.div>

      {/* ─── System Status Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statusCards.map((card, i) => (
          <motion.div key={card.label} variants={itemVariants}>
            <GlassCard glowColor={card.glow}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                  {card.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{card.value}</h3>
              {card.extra}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ─── User Overview + Credit Gauge ────────────────────────── */}
      <motion.div variants={itemVariants}>
        <GlassCard glowColor="purple">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">User Overview</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Info */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Name</span>
                <p className="text-sm text-slate-900 font-semibold mt-0.5">{user.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Email</span>
                <p className="text-sm text-slate-700 mt-0.5">{user.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Linked UPI IDs</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(user.linkedUpiIds || []).map(upi => (
                    <span key={upi} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-600 font-mono font-medium">
                      {upi}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Connected Banks */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Connected Banks</span>
              <div className="space-y-2.5 mt-2">
                {(user.banks || []).map(bank => (
                  <div
                    key={bank.bankName}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Landmark className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{bank.bankName}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-medium">A/C •••• {bank.accountNumber.slice(-4)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-950">
                      ₹{bank.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Score Gauge */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold mb-3">Credit Score</span>
              <CreditGauge score={user.creditScore} />
              <p className="text-[10px] text-slate-500 mt-2 font-mono text-center font-medium">
                SpendSense Health Index
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ─── Data Overview (Tabbed) ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-605">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Data Overview</h4>
          </div>

          {/* Tab Bar */}
          <div className="flex flex-wrap gap-1.5 mb-5 p-1 rounded-xl bg-slate-100/80 border border-slate-200">
            {tabConfig.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Total Transactions</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{transactions.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/5">
                    <span className="text-[10px] text-emerald-605 uppercase tracking-widest font-mono font-bold">Income</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      ₹{totalIncome.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {transactions.filter(t => t.type === 'income').length} entries
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-50/5">
                    <span className="text-[10px] text-rose-605 uppercase tracking-widest font-mono font-bold">Expense</span>
                    <p className="text-2xl font-bold text-rose-600 mt-1">
                      ₹{totalExpense.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {transactions.filter(t => t.type === 'expense').length} entries
                    </span>
                  </div>
                </div>
              )}

              {/* Loans Tab */}
              {activeTab === 'loans' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Total Loans</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{loans.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/5">
                    <span className="text-[10px] text-blue-605 uppercase tracking-widest font-mono font-bold">Active Loans</span>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{activeLoans.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/5">
                    <span className="text-[10px] text-amber-605 uppercase tracking-widest font-mono font-bold">Total Debt</span>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      ₹{totalDebt.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      EMI/mo: ₹{activeLoans.reduce((s, l) => s + l.emiAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Insurance Tab */}
              {activeTab === 'insurance' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Total Policies</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{insurance.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/5">
                    <span className="text-[10px] text-emerald-605 uppercase tracking-widest font-mono font-bold">Active Policies</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{activePolicies.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-50/5">
                    <span className="text-[10px] text-purple-650 uppercase tracking-widest font-mono font-bold">Total Coverage</span>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      ₹{totalCoverage.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Premium/yr: ₹{activePolicies.reduce((s, i) => s + i.premiumAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Investments Tab */}
              {activeTab === 'investments' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Holdings</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{investments.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/5">
                    <span className="text-[10px] text-blue-605 uppercase tracking-widest font-mono font-bold">Portfolio Value</span>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ₹{portfolioValue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border ${portfolioPnL >= 0 ? 'border-emerald-500/20 bg-emerald-50/5' : 'border-rose-500/20 bg-rose-50/5'}`}>
                    <span className={`text-[10px] uppercase tracking-widest font-mono font-bold ${portfolioPnL >= 0 ? 'text-emerald-605' : 'text-rose-605'}`}>
                      P&amp;L
                    </span>
                    <p className={`text-2xl font-bold mt-1 ${portfolioPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {portfolioPnL >= 0 ? '+' : ''}₹{portfolioPnL.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Cost Basis: ₹{portfolioCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Subscriptions Tab */}
              {activeTab === 'subscriptions' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Total Subscriptions</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{subscriptions.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/5">
                    <span className="text-[10px] text-blue-605 uppercase tracking-widest font-mono font-bold">Active</span>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{activeSubs.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-50/5">
                    <span className="text-[10px] text-purple-650 uppercase tracking-widest font-mono font-bold">Monthly Cost</span>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      ₹{Math.round(monthlySubsCost).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Low usage: {subscriptions.filter(s => s.usageFrequency === 'low').length}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* ─── Bottom Grid: Activity + API Config + Data Mgmt ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Recent Activity Feed ────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Recent Activity</h4>
              <span className="ml-auto text-[10px] text-slate-500 font-mono font-semibold">Last 5</span>
            </div>

            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentNotifications.map((notif, idx) => (
                  <div key={notif.id} className="relative flex gap-3 pb-4">
                    {/* Timeline line */}
                    {idx < recentNotifications.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-px h-[calc(100%-12px)] bg-slate-200" />
                    )}
                    {/* Icon dot */}
                    <div className="relative z-10 mt-0.5 flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${notifColor(notif.type)}`}>
                        <NotificationIcon type={notif.type} />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between">
                        <p className="text-xs font-semibold text-slate-800 truncate">{notif.title}</p>
                        <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ─── API Configuration Panel ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Key className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">API Configuration</h4>
              <span className="ml-auto px-2 py-0.5 rounded bg-slate-100 text-[9px] text-slate-500 font-mono font-semibold">
                READONLY
              </span>
            </div>

            <div className="space-y-4">
              {/* API Base URL */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-1.5 font-semibold">
                  <Globe className="w-3 h-3" />
                  API Base URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                    http://localhost:5000/api
                  </div>
                  <button
                    onClick={() => copyToClipboard('http://localhost:5000/api', 'api')}
                    className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    {copied === 'api' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-1.5 font-semibold">
                  <Lock className="w-3 h-3" />
                  Gemini API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                    {showApiKey ? 'AIzaSy••••••••••••••mock_demo_key' : '••••••••••••••••••••••••••••••••••••'}
                  </div>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-emerald-600 font-mono font-medium">Key configured</span>
                </div>
              </div>

              {/* MongoDB URI */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-1.5 font-semibold">
                  <DatabaseZap className="w-3 h-3" />
                  MongoDB URI
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                    mongodb+srv://••••••@cluster0.••••••.mongodb.net/spendsense
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className={`text-[9px] font-mono font-medium ${backendConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {backendConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ─── Data Management Actions ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <HardDrive className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Data Management</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Clear All Data */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClearData}
              className={`group flex flex-col items-center gap-3 p-5 rounded-xl border transition-all cursor-pointer ${
                clearConfirm
                  ? 'border-rose-500/40 bg-rose-50 shadow-lg shadow-rose-500/5'
                  : 'border-slate-100 bg-slate-50/50 hover:border-rose-500/20 hover:bg-rose-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                clearConfirm ? 'bg-rose-500/20 text-rose-600' : 'bg-slate-100 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-600'
              }`}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${clearConfirm ? 'text-rose-600' : 'text-slate-800'}`}>
                  {clearConfirm ? 'Click again to confirm' : 'Clear All Data'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {clearConfirm ? 'This action is irreversible' : 'Wipe all localStorage entries'}
                </p>
              </div>
            </motion.button>

            {/* Reset to Defaults */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleResetDefaults}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-amber-500/20 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-800">Reset to Defaults</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Restore initial mock data</p>
              </div>
            </motion.button>

            {/* Export JSON */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportJSON}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-blue-500/20 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-800">Export All Data</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Download as JSON file</p>
              </div>
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
