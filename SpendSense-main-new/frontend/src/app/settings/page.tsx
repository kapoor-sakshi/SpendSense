'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, CreditCard, Shield, Bell, Eye, Lock,
  Smartphone, Info, Plus, ChevronRight, Check, X,
  Landmark, Mail, Calendar, Fingerprint, HelpCircle,
  ToggleLeft, ToggleRight, Zap, BarChart3, Brain,
  Moon, BellRing, FileText, Sparkles, ExternalLink
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useApp } from '../../context/AppContext';

/* ───────── toggle switch ───────── */
const ToggleSwitch = ({
  enabled,
  onToggle,
  locked = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  locked?: boolean;
}) => (
  <button
    onClick={locked ? undefined : onToggle}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
      locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
    } ${enabled ? 'bg-purple-600' : 'bg-slate-200'}`}
  >
    <motion.span
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-block h-5 w-5 rounded-full bg-white shadow-md ${
        enabled ? 'ml-6' : 'ml-1'
      }`}
    />
    {locked && (
      <Lock className="absolute -right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
    )}
  </button>
);

/* ───────── credit score gauge (SVG arc) ───────── */
const CreditScoreGauge = ({ score, maxScore = 900 }: { score: number; maxScore?: number }) => {
  const percentage = Math.min(score / maxScore, 1);
  const radius = 80;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 100;

  // Semi-circle from 180° to 0° (left to right, bottom arc)
  const startAngle = Math.PI; // 180°
  const endAngle = 0;        // 0°
  const sweepAngle = startAngle - endAngle;
  const currentAngle = startAngle - sweepAngle * percentage;

  const arcPath = (startA: number, endA: number) => {
    const x1 = cx + radius * Math.cos(startA);
    const y1 = cy - radius * Math.sin(startA);
    const x2 = cx + radius * Math.cos(endA);
    const y2 = cy - radius * Math.sin(endA);
    const largeArc = Math.abs(startA - endA) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // color based on score
  let color = '#ef4444'; // red
  let label = 'Poor';
  if (score >= 700) {
    color = '#10b981';
    label = 'Excellent';
  } else if (score >= 500) {
    color = '#f59e0b';
    label = 'Good';
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* background arc */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="rgba(15,23,42,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* filled arc */}
        <motion.path
          d={arcPath(startAngle, currentAngle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
        {/* score text */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#0F172A" fontSize="28" fontWeight="bold">
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#475569" fontSize="11">
          out of {maxScore}
        </text>
      </svg>
      <span
        className="text-sm font-semibold -mt-1"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
};

/* ───────── toast notification ───────── */
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl
      bg-purple-600 backdrop-blur-md text-white text-sm font-medium shadow-2xl shadow-purple-600/10
      flex items-center gap-3"
  >
    <Check className="w-4 h-4 text-emerald-300" />
    {message}
    <button onClick={onClose} className="ml-2 hover:text-zinc-300 transition-colors">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

/* ───────── bank icon helper ───────── */
const bankColors: Record<string, string> = {
  SBI: 'from-blue-500 to-blue-700',
  HDFC: 'from-red-500 to-red-700',
  'Axis Bank': 'from-pink-500 to-fuchsia-700',
  ICICI: 'from-orange-500 to-orange-700',
};

/* ───────── main page ───────── */
export default function SettingsPage() {
  const { user } = useApp();

  const [displayName, setDisplayName] = useState(user.name);
  const [toast, setToast] = useState<string | null>(null);

  /* preferences local state */
  const [prefs, setPrefs] = useState({
    darkMode: true,
    pushNotifications: true,
    emiReminders: true,
    weeklyReports: false,
    aiTips: true,
  });

  /* security local state */
  const [security, setSecurity] = useState({
    twoFactor: false,
    biometric: true,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const togglePref = (key: keyof typeof prefs) => {
    if (key === 'darkMode') return; // locked
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleSecurity = (key: keyof typeof security) => {
    setSecurity((s) => ({ ...s, [key]: !s[key] }));
  };

  /* animation variants */
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  };

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* ─── background gradients ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[100px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8"
      >
        {/* ═══════ PAGE HEADER ═══════ */}
        <motion.div variants={item} className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
            <Settings className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Profile &amp; Settings
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Manage your account, preferences &amp; security
            </p>
          </div>
        </motion.div>

        {/* ═══════ PROFILE SECTION ═══════ */}
        <motion.div variants={item}>
          <GlassCard glowColor="purple" className="mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* info */}
              <div className="flex-1 space-y-4 w-full">
                {/* name – editable */}
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5
                      text-slate-800 text-base focus:outline-none focus:border-purple-500
                      focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
                {/* email – readonly */}
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block font-semibold">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100/50 border border-slate-200 rounded-lg px-4 py-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 text-base">{user.email}</span>
                    <span className="ml-auto text-[10px] bg-emerald-550/10 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                      Verified
                    </span>
                  </div>
                </div>
                {/* member since */}
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Member since January 2024</span>
                </div>
              </div>

              {/* credit score gauge */}
              <div className="sm:ml-4 flex-shrink-0">
                <p className="text-xs text-slate-500 uppercase tracking-wider text-center mb-2 font-semibold">
                  Credit Score
                </p>
                <CreditScoreGauge score={user.creditScore} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════ CONNECTED BANKS ═══════ */}
        <motion.div variants={item}>
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-800">Connected Banks</h2>
              </div>
              <button
                onClick={() => showToast('Bank linking flow will open in a future update.')}
                className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700
                  bg-purple-50 hover:bg-purple-100/50 px-3.5 py-1.5 rounded-lg
                  border border-purple-200 transition-all cursor-pointer font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Bank
              </button>
            </div>

            <div className="space-y-3">
              {(user.banks || []).map((bank, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50
                    border border-slate-100 hover:border-slate-200/80 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                        bankColors[bank.bankName] || 'from-zinc-500 to-zinc-700'
                      } flex items-center justify-center text-white font-bold text-sm shadow`}
                    >
                      {bank.bankName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">{bank.bankName}</p>
                      <p className="text-slate-500 text-xs">{bank.accountNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {bank.accountType}
                    </span>
                    <p className="text-slate-800 font-semibold min-w-[100px] text-right">
                      ₹{bank.balance.toLocaleString('en-IN')}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════ LINKED UPI ═══════ */}
        <motion.div variants={item}>
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-800">Linked UPI IDs</h2>
              </div>
              <button
                onClick={() => showToast('UPI linking will be available soon.')}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700
                  bg-emerald-50 hover:bg-emerald-100/50 px-3.5 py-1.5 rounded-lg
                  border border-emerald-200 transition-all cursor-pointer font-medium"
              >
                <Plus className="w-4 h-4" />
                Add UPI
              </button>
            </div>

            <div className="space-y-3">
              {(user.linkedUpiIds || []).map((upi, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50
                    border border-slate-100 hover:border-slate-200/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-slate-800 font-mono text-sm">{upi}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-600 text-xs font-semibold">Active</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════ PREFERENCES ═══════ */}
        <motion.div variants={item}>
          <GlassCard className="mb-6">
            <div className="flex items-center gap-3 mb-5">
              <Bell className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800">Preferences</h2>
            </div>

            <div className="space-y-1">
              {[
                { key: 'darkMode' as const, label: 'Dark Mode', icon: Moon, desc: 'Always-on dark theme', locked: true },
                { key: 'pushNotifications' as const, label: 'Push Notifications', icon: BellRing, desc: 'Get real-time transaction alerts' },
                { key: 'emiReminders' as const, label: 'EMI Reminders', icon: Calendar, desc: 'Remind 3 days before EMI due date' },
                { key: 'weeklyReports' as const, label: 'Weekly Spending Reports', icon: FileText, desc: 'AI-generated weekly summaries via email' },
                { key: 'aiTips' as const, label: 'AI Financial Tips', icon: Brain, desc: 'Smart suggestions to optimise spending' },
              ].map(({ key, label, icon: Icon, desc, locked }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-850 text-sm font-semibold">{label}</p>
                      <p className="text-slate-500 text-xs">{desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={prefs[key]}
                    onToggle={() => togglePref(key)}
                    locked={locked}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════ SECURITY ═══════ */}
        <motion.div variants={item}>
          <GlassCard glowColor="blue" className="mb-6">
            <div className="flex items-center gap-3 mb-5">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Security</h2>
            </div>

            {/* change password */}
            <button
              onClick={() => showToast('Password change flow coming soon.')}
              className="w-full flex items-center justify-between p-4 rounded-xl
                bg-slate-50/50 border border-slate-100 hover:border-slate-200/80
                hover:bg-slate-100/50 transition-all mb-3 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-left">
                  <p className="text-slate-800 text-sm font-semibold">Change Password</p>
                  <p className="text-slate-500 text-xs">Last changed 32 days ago</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* toggles */}
            <div className="space-y-1">
              {[
                { key: 'twoFactor' as const, label: 'Two-Factor Authentication', icon: Eye, desc: 'Add extra security with OTP verification' },
                { key: 'biometric' as const, label: 'Biometric Login', icon: Fingerprint, desc: 'Fingerprint or Face ID authentication' },
              ].map(({ key, label, icon: Icon, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-800 text-sm font-semibold">{label}</p>
                      <p className="text-slate-500 text-xs">{desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={security[key]}
                    onToggle={() => toggleSecurity(key)}
                  />
                </div>
              ))}
            </div>

            {/* last login */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              Last login: Today at 10:42 PM · New Delhi, India
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════ ABOUT ═══════ */}
        <motion.div variants={item}>
          <GlassCard className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-800">About</h2>
            </div>

            <div className="space-y-3">
              {[
                { label: 'App Version', value: 'v2.0.0-beta', accent: true },
                { label: 'Platform', value: 'SpendSense AI Premium' },
                { label: 'Support', value: 'support@spendsense.ai', accent: true },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 px-1 border-b border-slate-100 last:border-0"
                >
                  <span className="text-slate-500 text-sm">{label}</span>
                  <span
                    className={`text-sm font-semibold ${
                      accent ? 'text-purple-600' : 'text-slate-750'
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-slate-500">
                Built with 💜 by the SpendSense AI team
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ─── toast ─── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

