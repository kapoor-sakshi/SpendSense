'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Heart,
  Users,
  Car,
  Coins,
  Calendar,
  Plus,
  X,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Shield,
  Zap,
  Target,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';

/* ───────────────────── helpers ───────────────────── */

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const policyTypeConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; badge: string; chartColor: string }
> = {
  Health: {
    icon: Heart,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    chartColor: '#10b981',
  },
  Life: {
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border border-blue-100',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    chartColor: '#2563eb',
  },
  Vehicle: {
    icon: Car,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border border-amber-100',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    chartColor: '#f59e0b',
  },
  'Investment-Linked': {
    icon: Coins,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border border-purple-100',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    chartColor: '#7c3aed',
  },
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  expired: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  lapsed: { color: 'bg-amber-50 text-amber-700 border-amber-250', icon: AlertCircle },
};

const intervalMultiplier: Record<string, number> = {
  Monthly: 12,
  Quarterly: 4,
  Yearly: 1,
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-slate-800">
        <p className="font-bold text-sm">{payload[0].name}</p>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          Coverage: <span className="text-slate-850 font-bold">{fmt(payload[0].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

/* ───────────────────── page ───────────────────────── */

export default function InsurancePage() {
  const { insurance, addInsurance } = useApp();
  const [showModal, setShowModal] = useState(false);

  /* ---- Form state ---- */
  const [formData, setFormData] = useState({
    policyName: '',
    provider: '',
    policyType: 'Health' as 'Health' | 'Life' | 'Vehicle' | 'Investment-Linked',
    coverageAmount: '',
    premiumAmount: '',
    paymentInterval: 'Yearly' as 'Monthly' | 'Quarterly' | 'Yearly',
    nextPremiumDate: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  /* ---- Derived stats ---- */
  const totalCoverage = useMemo(
    () => insurance.reduce((sum, p) => sum + p.coverageAmount, 0),
    [insurance],
  );

  const annualPremium = useMemo(
    () =>
      insurance.reduce(
        (sum, p) => sum + p.premiumAmount * (intervalMultiplier[p.paymentInterval] || 1),
        0,
      ),
    [insurance],
  );

  const activePolicies = useMemo(
    () => insurance.filter((p) => p.status === 'active').length,
    [insurance],
  );

  /* ---- Chart data ---- */
  const coverageByType = useMemo(() => {
    const map: Record<string, number> = {};
    insurance.forEach((p) => {
      map[p.policyType] = (map[p.policyType] || 0) + p.coverageAmount;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: policyTypeConfig[name]?.chartColor || '#8884d8',
    }));
  }, [insurance]);

  /* ---- Max coverage for meter ---- */
  const maxCoverage = useMemo(
    () => Math.max(...insurance.map((p) => p.coverageAmount), 1),
    [insurance],
  );

  /* ---- Premium calendar data (next 6 months) ---- */
  const premiumCalendar = useMemo(() => {
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const months: { label: string; key: string; items: typeof insurance }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        key: `${d.getFullYear()}-${d.getMonth()}`,
        items: [],
      });
    }

    insurance.forEach((p) => {
      const premDate = new Date(p.nextPremiumDate);
      if (premDate >= now && premDate <= sixMonthsLater) {
        const key = `${premDate.getFullYear()}-${premDate.getMonth()}`;
        const month = months.find((m) => m.key === key);
        if (month) month.items.push(p);
      }
    });

    return months;
  }, [insurance]);

  /* ---- AI Recommendation ---- */
  const aiRecommendation = useMemo(() => {
    const types = insurance.map((p) => p.policyType);
    const gaps: string[] = [];
    if (!types.includes('Health')) gaps.push('Consider adding HDFC Ergo health insurance cover for medical emergencies.');
    if (!types.includes('Life')) gaps.push('A term Life insurance policy (e.g. LIC) is essential for family protection.');
    if (!types.includes('Vehicle')) gaps.push('Vehicle insurance is mandatory and protects against accident liabilities.');
    if (!types.includes('Investment-Linked'))
      gaps.push('An investment-linked plan (ULIP) can grow your wealth while providing cover.');

    const totalCov = insurance.reduce((s, p) => s + p.coverageAmount, 0);
    let adequacy = 'Your coverage portfolio looks well-diversified.';
    if (totalCov < 5000000) adequacy = 'Your total coverage of ' + fmt(totalCov) + ' may be insufficient. Financial advisors recommend at least 10x annual income.';
    else if (totalCov < 10000000) adequacy = 'Your coverage of ' + fmt(totalCov) + ' is moderate. Consider increasing life cover to 15x annual income for robust protection.';
    else adequacy = 'Excellent! Your total coverage of ' + fmt(totalCov) + ' provides strong financial protection for your family.';

    const tips: string[] = [];
    const yearlyPolicies = insurance.filter((p) => p.paymentInterval === 'Yearly');
    if (yearlyPolicies.length < insurance.length) {
      tips.push('Switch monthly/quarterly premiums to annual payment for 5-8% savings.');
    }
    tips.push('Compare renewal quotes from 3+ providers before each renewal cycle.');
    tips.push('Review nominee details and sum insured every year to keep pace with inflation.');

    return { gaps, adequacy, tips };
  }, [insurance]);

  /* ---- Form submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyName || !formData.provider || !formData.coverageAmount || !formData.premiumAmount || !formData.nextPremiumDate) return;
    setFormSubmitting(true);
    try {
      await addInsurance({
        policyName: formData.policyName,
        provider: formData.provider,
        policyType: formData.policyType,
        coverageAmount: parseFloat(formData.coverageAmount),
        premiumAmount: parseFloat(formData.premiumAmount),
        paymentInterval: formData.paymentInterval,
        nextPremiumDate: new Date(formData.nextPremiumDate).toISOString(),
      });
      setFormData({
        policyName: '',
        provider: '',
        policyType: 'Health',
        coverageAmount: '',
        premiumAmount: '',
        paymentInterval: 'Yearly',
        nextPremiumDate: '',
      });
      setShowModal(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-blue-200/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Insurance Portfolio
              </h1>
              <p className="text-xs text-slate-500 mt-1">Manage & track all your active insurance coverage policies</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Policy
          </button>
        </div>

        {/* Coverage Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Total Coverage */}
          <GlassCard glowColor="purple">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Coverage</p>
                <p className="text-2xl font-bold text-slate-900 mt-2.5">{fmt(totalCoverage)}</p>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">{insurance.length} policies combined</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-inner">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </GlassCard>

          {/* Annual Premium */}
          <GlassCard glowColor="blue">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Annual Premium</p>
                <p className="text-2xl font-bold text-slate-900 mt-2.5">{fmt(annualPremium)}</p>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">{fmt(Math.round(annualPremium / 12))}/month avg</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-inner">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </GlassCard>

          {/* Active Policies */}
          <GlassCard glowColor="green">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Policies</p>
                <p className="text-2xl font-bold text-slate-900 mt-2.5">{activePolicies}</p>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">
                  {insurance.length - activePolicies > 0
                    ? `${insurance.length - activePolicies} inactive`
                    : 'All policies active'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Policy Cards Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-650" />
            Your Policies
          </h2>

          {insurance.length === 0 ? (
            <div className="flex flex-col justify-center items-center text-center p-12 border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm max-w-xl mx-auto">
              <ShieldCheck className="h-10 w-10 text-slate-400 mb-3" />
              <p className="font-semibold text-slate-800 text-sm">No insurance policies yet</p>
              <p className="text-xs text-slate-400 mt-1">Click Add Policy to register coverage plans.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {insurance.map((policy, idx) => {
                const cfg = policyTypeConfig[policy.policyType] || policyTypeConfig.Health;
                const StatusIcon = statusConfig[policy.status]?.icon || CheckCircle2;
                const Icon = cfg.icon;
                const days = daysUntil(policy.nextPremiumDate);
                const coveragePercent = (policy.coverageAmount / maxCoverage) * 100;

                return (
                  <GlassCard key={policy.id} className="bg-white border-slate-200/80 hover:border-purple-300 transition-all duration-300 shadow-sm">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cfg.bg}`}>
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                        </div>
                        <div>
                          <h3 className="text-slate-800 font-bold text-sm leading-tight">{policy.policyName}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">{policy.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Policy type badge */}
                        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                          {policy.policyType}
                        </span>
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold capitalize ${statusConfig[policy.status]?.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {policy.status}
                        </span>
                      </div>
                    </div>

                    {/* Coverage amount */}
                    <div className="mb-3">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Coverage Amount</p>
                      <p className="text-lg font-extrabold text-slate-800 font-mono">{fmt(policy.coverageAmount)}</p>
                    </div>

                    {/* Coverage meter */}
                    <div className="mb-4">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${cfg.chartColor}80, ${cfg.chartColor})`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${coveragePercent}%` }}
                          transition={{ delay: 0.15 + idx * 0.05, duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Bottom info */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                      <div>
                        <p className="text-slate-400 text-[9px] font-bold uppercase">Premium</p>
                        <p className="text-slate-700 font-bold mt-0.5">
                          {fmt(policy.premiumAmount)}{' '}
                          <span className="text-slate-400 font-normal">/ {policy.paymentInterval.toLowerCase()}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px] font-bold uppercase">Next Premium</p>
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold mt-0.5 justify-end">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(policy.nextPremiumDate)}
                          <span
                            className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                              days <= 30
                                ? 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse'
                                : days <= 90
                                ? 'bg-amber-50 text-amber-700 border-amber-250'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-250'
                            }`}
                          >
                            {days}d
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Coverage distribution and premium calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage Distribution Chart */}
          <GlassCard className="bg-white border-slate-200/80 shadow-sm">
            <h3 className="text-slate-900 font-semibold text-sm mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-650" />
              Coverage Distribution
            </h3>
            {coverageByType.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coverageByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {coverageByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-slate-500 text-xs font-semibold">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
                No policy metrics logged.
              </div>
            )}
          </GlassCard>

          {/* Premium Calendar */}
          <GlassCard className="bg-white border-slate-200/80 shadow-sm">
            <h3 className="text-slate-900 font-semibold text-sm mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Premium Calendar
              <span className="text-slate-400 text-xs font-normal ml-1">(next 6 months)</span>
            </h3>
            <div className="space-y-4 max-h-[270px] overflow-y-auto pr-1">
              {premiumCalendar.map((month) => (
                <div key={month.key} className="space-y-2">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{month.label}</p>
                  {month.items.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <p className="text-slate-400 text-xs">No premiums due</p>
                    </div>
                  ) : (
                    month.items.map((p) => {
                      const cfg = policyTypeConfig[p.policyType] || policyTypeConfig.Health;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg}`}>
                              <Icon className={`h-4 w-4 ${cfg.color}`} />
                            </div>
                            <div>
                              <p className="text-slate-800 text-xs font-bold">{p.policyName}</p>
                              <p className="text-slate-405 text-[10px]">{formatDate(p.nextPremiumDate)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-900 text-xs font-bold font-mono">{fmt(p.premiumAmount)}</p>
                            <p className="text-slate-400 text-[10px]">{p.paymentInterval}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* AI Recommendations */}
        <GlassCard glowColor="purple" className="relative overflow-hidden bg-white border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-sm">AI Insurance Advisor</h3>
              <p className="text-slate-400 text-[10px]">Personalized coverage adequacy reviews</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Coverage Adequacy */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Coverage Adequacy</p>
              </div>
              <p className="text-slate-550 text-xs leading-relaxed">{aiRecommendation.adequacy}</p>
            </div>

            {/* Gap Analysis */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Gap Analysis</p>
              </div>
              {aiRecommendation.gaps.length > 0 ? (
                <ul className="space-y-2">
                  {aiRecommendation.gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-550 text-xs leading-relaxed">
                      <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-amber-600 flex-shrink-0" />
                      {gap}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-600 font-semibold text-xs">All key insurance coverages linked! 🎉</p>
              )}
            </div>

            {/* Premium Optimization */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-600" />
                <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Premium Tips</p>
              </div>
              <ul className="space-y-2">
                {aiRecommendation.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-550 text-xs leading-relaxed">
                    <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Add Policy Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="text-slate-900 text-sm font-bold">Add Insurance Policy</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Policy Name */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Policy Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Ergo Optima Secure"
                    value={formData.policyName}
                    onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                    required
                  />
                </div>

                {/* Provider + Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Provider</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Ergo"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Policy Type</label>
                    <select
                      value={formData.policyType}
                      onChange={(e) => setFormData({ ...formData, policyType: e.target.value as any })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                    >
                      <option value="Health">Health</option>
                      <option value="Life">Life</option>
                      <option value="Vehicle">Vehicle</option>
                      <option value="Investment-Linked">Investment-Linked</option>
                    </select>
                  </div>
                </div>

                {/* Coverage + Premium */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Coverage Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={formData.coverageAmount}
                      onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                      required
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Premium Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15400"
                      value={formData.premiumAmount}
                      onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                      required
                      min={0}
                    />
                  </div>
                </div>

                {/* Interval + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Payment Interval</label>
                    <select
                      value={formData.paymentInterval}
                      onChange={(e) => setFormData({ ...formData, paymentInterval: e.target.value as any })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Next Premium Date</label>
                    <input
                      type="date"
                      value={formData.nextPremiumDate}
                      onChange={(e) => setFormData({ ...formData, nextPremiumDate: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-750 py-3 text-xs font-bold text-white shadow-md disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {formSubmitting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding Policy...
                      </>
                    ) : (
                      'Register Policy Sum'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
