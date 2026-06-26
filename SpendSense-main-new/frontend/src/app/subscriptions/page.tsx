'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv,
  AlertTriangle,
  TrendingDown,
  Plus,
  Calendar,
  Sparkles,
  X,
  DollarSign,
  Zap,
  Wifi,
  Smartphone,
  Film,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowDownRight,
  ShieldAlert,
  Lightbulb,
  BarChart3,
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
  Cell,
} from 'recharts';

/* ──────────────────────── helpers ──────────────────────── */

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const categoryIcons: Record<string, React.ReactNode> = {
  OTT: <Film className="w-3.5 h-3.5" />,
  Mobile: <Smartphone className="w-3.5 h-3.5" />,
  Internet: <Wifi className="w-3.5 h-3.5" />,
  Utilities: <Zap className="w-3.5 h-3.5" />,
  Others: <Package className="w-3.5 h-3.5" />,
};

const categoryColors: Record<string, string> = {
  OTT: '#7c3aed',
  Mobile: '#2563eb',
  Internet: '#06b6d4',
  Utilities: '#f59e0b',
  Others: '#64748b',
};

const categoryBadgeClasses: Record<string, string> = {
  OTT: 'bg-purple-50 text-purple-700 border-purple-205',
  Mobile: 'bg-blue-50 text-blue-700 border-blue-205',
  Internet: 'bg-cyan-50 text-cyan-700 border-cyan-205',
  Utilities: 'bg-amber-50 text-amber-700 border-amber-205',
  Others: 'bg-slate-50 text-slate-600 border-slate-205',
};

const serviceEmojis: Record<string, string> = {
  Netflix: '🎬',
  Spotify: '🎵',
  Amazon: '📦',
  Disney: '🏰',
  Hotstar: '🏏',
  Jio: '📡',
  Airtel: '📶',
  YouTube: '▶️',
  Apple: '🍎',
  HBO: '🎭',
};

function getServiceEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(serviceEmojis)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '📺';
}

function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ──────────────────── usage bar component ──────────────── */

function UsageBars({ level }: { level: 'low' | 'medium' | 'high' }) {
  const fills = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  const color =
    level === 'high'
      ? 'bg-emerald-500'
      : level === 'medium'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="flex items-end gap-[3px]">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-[5px] rounded-sm transition-colors ${
            i <= fills ? color : 'bg-slate-200'
          }`}
          style={{ height: `${8 + i * 4}px` }}
        />
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-md text-slate-800">
      <p className="text-slate-400 font-mono mb-1">{label}</p>
      <p className="font-bold">{fmt(payload[0].value)}</p>
    </div>
  );
}

/* ──────────────────── page ───────────────────────── */

export default function SubscriptionsPage() {
  const { subscriptions, addSubscription, loading } = useApp();
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formInterval, setFormInterval] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [formNextDate, setFormNextDate] = useState('');
  const [formCategory, setFormCategory] = useState<'OTT' | 'Mobile' | 'Internet' | 'Utilities' | 'Others'>('OTT');
  const [formUsage, setFormUsage] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ──────── derived calculations ──────── */
  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.status === 'active'),
    [subscriptions]
  );

  const monthlyCost = useMemo(
    () =>
      activeSubs
        .filter((s) => s.interval === 'Monthly')
        .reduce((sum, s) => sum + s.cost, 0),
    [activeSubs]
  );

  const yearlyCostMonthly = useMemo(
    () =>
      Math.round(
        activeSubs
          .filter((s) => s.interval === 'Yearly')
          .reduce((sum, s) => sum + s.cost, 0) / 12
      ),
    [activeSubs]
  );

  const totalMonthlyCost = monthlyCost + yearlyCostMonthly;

  const wastedSubs = useMemo(
    () => activeSubs.filter((s) => s.usageFrequency === 'low'),
    [activeSubs]
  );

  const monthlyWaste = useMemo(
    () =>
      wastedSubs.reduce(
        (sum, s) =>
          sum + (s.interval === 'Yearly' ? Math.round(s.cost / 12) : s.cost),
        0
      ),
    [wastedSubs]
  );

  /* ──── category chart data ──── */
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    activeSubs.forEach((s) => {
      const monthlized =
        s.interval === 'Yearly' ? Math.round(s.cost / 12) : s.cost;
      map[s.category] = (map[s.category] || 0) + monthlized;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      fill: categoryColors[name] || '#64748b',
    }));
  }, [activeSubs]);

  /* ──── form submission ──── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCost || !formNextDate) return;
    setIsSubmitting(true);
    try {
      await addSubscription({
        name: formName.trim(),
        cost: parseFloat(formCost),
        interval: formInterval,
        nextBillingDate: new Date(formNextDate).toISOString(),
        category: formCategory,
        usageFrequency: formUsage,
      });
      setFormName('');
      setFormCost('');
      setFormInterval('Monthly');
      setFormNextDate('');
      setFormCategory('OTT');
      setFormUsage('medium');
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ──── smart insights ──── */
  const smartInsights = useMemo(() => {
    const tips: string[] = [];

    if (wastedSubs.length > 0) {
      tips.push(
        `You have ${wastedSubs.length} low-usage subscription${wastedSubs.length > 1 ? 's' : ''}. Cancelling them saves ${fmt(monthlyWaste)}/month — that's ${fmt(monthlyWaste * 12)}/year.`
      );
    }

    const ottSubs = activeSubs.filter((s) => s.category === 'OTT');
    if (ottSubs.length >= 3) {
      tips.push(
        `You subscribe to ${ottSubs.length} OTT platforms simultaneously. Consider rotating between services monthly instead of keeping all active.`
      );
    }

    if (totalMonthlyCost > 2000) {
      tips.push(
        `Your total subscription spend of ${fmt(totalMonthlyCost)}/month exceeds ₹2,000. Look into family/group sharing options to optimize outlays.`
      );
    }

    const yearlySubs = activeSubs.filter((s) => s.interval === 'Monthly');
    if (yearlySubs.length >= 2) {
      tips.push(
        `Switching ${yearlySubs.length} monthly plans to annual billing can save up to 15-20% per service (most offer 2 months free on yearly billing).`
      );
    }

    if (tips.length === 0) {
      tips.push(
        'Your subscription portfolio looks well-optimized! Keep monitoring usage frequencies to make sure you get value.'
      );
    }

    return tips;
  }, [activeSubs, wastedSubs, monthlyWaste, totalMonthlyCost]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <span className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-xs tracking-wider animate-pulse uppercase">
          Scanning active subscriptions...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 bg-slate-50 text-slate-800">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-900">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Tv className="w-5 h-5" />
            </div>
            <span>Subscriptions &amp; OTT Analyzer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 ml-[52px]">
            Track, analyze, and optimize your recurring digital subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Cost */}
        <GlassCard glowColor="purple">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Monthly Cost</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{fmt(monthlyCost)}</h3>
          <p className="text-[10px] text-slate-400 mt-2">
            From {activeSubs.filter((s) => s.interval === 'Monthly').length} monthly plans
          </p>
        </GlassCard>

        {/* Yearly Eq */}
        <GlassCard glowColor="blue">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Yearly (Monthly Eq.)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{fmt(yearlyCostMonthly)}</h3>
          <p className="text-[10px] text-slate-400 mt-2">
            {fmt(activeSubs.filter((s) => s.interval === 'Yearly').reduce((s, sub) => s + sub.cost, 0))} billed annually
          </p>
        </GlassCard>

        {/* Wasted Cost */}
        <GlassCard glowColor="none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Money Wasted</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-rose-600">{fmt(monthlyWaste)}</h3>
          <p className="text-[10px] text-slate-400 mt-2">
            {wastedSubs.length} low-usage plan(s)
          </p>
        </GlassCard>

        {/* Active Plans */}
        <GlassCard glowColor="green">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Active Plans</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{activeSubs.length}</h3>
          <p className="text-[10px] text-slate-400 mt-2">
            {subscriptions.filter((s) => s.status === 'cancelled').length} cancelled
          </p>
        </GlassCard>
      </div>

      {/* Subscription Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-650" />
          Your Subscriptions
        </h2>

        {subscriptions.length === 0 ? (
          <div className="flex flex-col justify-center items-center text-center p-12 border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm max-w-xl mx-auto">
            <Tv className="w-10 h-10 text-slate-400 mb-3" />
            <p className="font-semibold text-slate-800 text-sm">No subscriptions monitored</p>
            <p className="text-xs text-slate-400 mt-1">Click Add Subscription to start tracking digital bills.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subscriptions.map((sub) => {
              const daysLeft = getDaysUntil(sub.nextBillingDate);
              const isLow = sub.usageFrequency === 'low' && sub.status === 'active';
              const isCancelled = sub.status === 'cancelled';

              return (
                <GlassCard
                  key={sub.id}
                  className={`bg-white border-slate-200/80 shadow-sm relative overflow-hidden ${isLow ? 'border-amber-300' : ''} ${isCancelled ? 'opacity-60' : ''}`}
                >
                  {/* Warning badge */}
                  {isLow && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-250 text-amber-700 text-[9px] font-bold">
                      <AlertTriangle className="w-3 h-3" /> Consider Cancelling
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                      {getServiceEmoji(sub.name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{sub.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${categoryBadgeClasses[sub.category] || categoryBadgeClasses.Others}`}>
                          {categoryIcons[sub.category]}
                          {sub.category}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold ${isCancelled ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isCancelled ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isCancelled ? 'Cancelled' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-slate-800">{fmt(sub.cost)}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/{sub.interval === 'Monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    {sub.interval === 'Yearly' && (
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">≈ {fmt(Math.round(sub.cost / 12))}/mo</span>
                    )}
                  </div>

                  {/* Billing timeline info */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-150 shadow-inner">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{new Date(sub.nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${daysLeft <= 3 ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                  </div>

                  {/* Usage meter bar */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Usage</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold capitalize ${sub.usageFrequency === 'high' ? 'text-emerald-600' : sub.usageFrequency === 'medium' ? 'text-amber-600' : 'text-rose-600'}`}>
                        {sub.usageFrequency}
                      </span>
                      <UsageBars level={sub.usageFrequency} />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Breakdown chart & wastage alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost Breakdown */}
        <div className="lg:col-span-2">
          <GlassCard className="h-[380px] flex flex-col justify-between bg-white border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-purple-650" />
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Monthly Cost by Category</h4>
                </div>
                <p className="text-[10px] text-slate-405 ml-6">Normalized monthly equivalent for annual subscriptions</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-950 font-mono">{fmt(totalMonthlyCost)}</p>
                <p className="text-[10px] text-slate-405">Total / month</p>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barSize={38}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Wastage warnings */}
        <GlassCard className="h-[380px] flex flex-col justify-between bg-white border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Wastage Alert</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Low-usage subscriptions</p>
              </div>
            </div>

            {wastedSubs.length > 0 ? (
              <>
                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 mb-4 shadow-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[9px] text-slate-405 uppercase tracking-widest font-bold font-mono">Monthly Waste</span>
                    <span className="text-xl font-bold text-rose-600 font-mono">{fmt(monthlyWaste)}</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                  {wastedSubs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getServiceEmoji(sub.name)}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{sub.name}</p>
                          <p className="text-[9px] text-slate-400">{sub.interval} · {sub.usageFrequency} usage</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-rose-600 font-mono">
                        {fmt(sub.interval === 'Yearly' ? Math.round(sub.cost / 12) : sub.cost)}
                        <span className="text-[9px] text-slate-450 font-normal">/mo</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-3" />
                <p className="text-xs text-slate-500 font-semibold max-w-[180px]">No wastage detected! All accounts report healthy usage rates.</p>
              </div>
            )}
          </div>

          {wastedSubs.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-250 mt-3 flex gap-1.5 items-start">
              <ArrowDownRight className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Savings Projection</div>
                <p className="text-[11px] text-emerald-700 leading-tight">Cancel unused plans to save <strong className="font-bold">{fmt(monthlyWaste * 12)}</strong> yearly.</p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Smart insights */}
      <GlassCard glowColor="purple" className="bg-white border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Smart Insights</h4>
            <p className="text-[10px] text-slate-400">AI-powered subscription optimization tips</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {smartInsights.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">{tip}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add Subscription Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Add Subscription</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase">Service Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Netflix Premium"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                    required
                  />
                </div>

                {/* Cost + Interval */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase">Cost (₹)</label>
                    <input
                      type="number"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      placeholder="e.g. 649"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                      required
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase">Billing Interval</label>
                    <select
                      value={formInterval}
                      onChange={(e) => setFormInterval(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Category + Usage */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                    >
                      <option value="OTT">OTT / Streaming</option>
                      <option value="Mobile">Mobile / SIM</option>
                      <option value="Internet">Internet / Broadband</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase">Usage Frequency</label>
                    <select
                      value={formUsage}
                      onChange={(e) => setFormUsage(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                    >
                      <option value="low">Low (Rarely Used)</option>
                      <option value="medium">Medium (Regularly Used)</option>
                      <option value="high">High (Daily/Heavy Use)</option>
                    </select>
                  </div>
                </div>

                {/* Next Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase">Next Renewal Date</label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing and Saving...
                    </>
                  ) : (
                    'Add Plan Subscription'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
