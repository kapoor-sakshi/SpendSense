'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Plus,
  X,
  ChevronDown,
  Eye,
  Sparkles,
  BarChart3,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';
import { availableStocks } from '../../utils/mockData';

// Color palette for pie chart slices
const PIE_COLORS = [
  '#7c3aed', // purple
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
];

// Helper: format ₹
const formatCurrency = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Simulated daily change for watchlist
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function InvestmentsPage() {
  const { investments, addInvestment } = useApp();
  const [showModal, setShowModal] = useState(false);

  // Portfolio aggregates
  const totalInvested = useMemo(
    () => investments.reduce((s, i) => s + i.quantity * i.buyPrice, 0),
    [investments]
  );
  const currentValue = useMemo(
    () => investments.reduce((s, i) => s + i.quantity * i.currentPrice, 0),
    [investments]
  );
  const totalPnL = currentValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPnlPositive = totalPnL >= 0;

  // Pie chart data
  const pieData = useMemo(
    () =>
      investments.map((inv) => ({
        name: inv.stockSymbol,
        value: inv.quantity * inv.currentPrice,
      })),
    [investments]
  );

  // Performance line-chart (simulated random walk 30 days)
  const performanceData = useMemo(() => {
    const points: { day: string; value: number }[] = [];
    let value = totalInvested * 0.92;
    const now = Date.now();
    for (let d = 30; d >= 0; d--) {
      const date = new Date(now - d * 86400000);
      const label = `${date.getDate()}/${date.getMonth() + 1}`;
      const drift = (currentValue - totalInvested * 0.92) / 30;
      const noise = (seededRandom(d * 137 + 42) - 0.5) * totalInvested * 0.012;
      value = value + drift + noise;
      points.push({ day: label, value: Math.round(value) });
    }
    if (points.length > 0) points[points.length - 1].value = Math.round(currentValue);
    return points;
  }, [totalInvested, currentValue]);

  // Watchlist with simulated daily change
  const watchlist = useMemo(
    () =>
      availableStocks.map((s, idx) => {
        const changePct = parseFloat(((seededRandom(idx * 73 + 19) - 0.4) * 6).toFixed(2));
        return { ...s, changePct };
      }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-200/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-blue-100/15 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Groww Investments
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Track your portfolio, monitor stocks, and manage investments in one place.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buy Stock
          </button>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Total Invested */}
          <GlassCard glowColor="purple">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-xs font-medium">Total Invested</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalInvested)}</p>
            <p className="text-xs text-slate-400 mt-1">{investments.length} holdings</p>
          </GlassCard>

          {/* Current Value */}
          <GlassCard glowColor="blue">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-xs font-medium">Current Value</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(currentValue)}</p>
            <p className="text-xs text-slate-400 mt-1">Live market price</p>
          </GlassCard>

          {/* Total P&L */}
          <GlassCard glowColor={isPnlPositive ? 'green' : 'none'}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg flex items-center justify-center ${isPnlPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {isPnlPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <span className="text-slate-500 text-xs font-medium">Total P&L</span>
            </div>
            <p className={`text-2xl font-bold ${isPnlPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPnlPositive ? '+' : '-'}
              {formatCurrency(totalPnL)}
            </p>
            <p className={`text-xs mt-1 font-semibold ${isPnlPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%
            </p>
          </GlassCard>
        </div>

        {/* Pie Distribution & Holdings Table */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Pie Distribution */}
          <div className="lg:col-span-2">
            <GlassCard className="h-full bg-white border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Portfolio Distribution</h2>
                </div>

                {investments.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-16">No investments linked yet.</p>
                ) : (
                  <>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: '#0f172a',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                            formatter={(value: number) => [formatCurrency(value), 'Value']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legends */}
                    <div className="flex flex-wrap gap-2.5 justify-center mt-4">
                      {pieData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          {entry.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Holdings Table */}
          <div className="lg:col-span-3">
            <GlassCard className="h-full bg-white border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Stock Holdings</h2>
              </div>

              {investments.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-4">
                  <Briefcase className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                  <p className="text-xs text-slate-500">No holdings. Click Buy Stock to purchase shares.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                        <th className="text-left pb-3">Stock</th>
                        <th className="text-right pb-3">Qty</th>
                        <th className="text-right pb-3">Buy Price</th>
                        <th className="text-right pb-3">CMP</th>
                        <th className="text-right pb-3">P&L</th>
                        <th className="text-right pb-3">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investments.map((inv) => {
                        const pnl = (inv.currentPrice - inv.buyPrice) * inv.quantity;
                        const pnlPercent =
                          inv.buyPrice > 0 ? ((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100 : 0;
                        const isUp = pnl >= 0;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3">
                              <span className="font-bold text-slate-800 block">{inv.stockSymbol}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                                {inv.stockName}
                              </span>
                            </td>
                            <td className="py-3 text-right font-semibold text-slate-700">{inv.quantity}</td>
                            <td className="py-3 text-right text-slate-500">{formatCurrency(inv.buyPrice)}</td>
                            <td className="py-3 text-right">
                              <span className="flex items-center justify-end gap-0.5 font-bold">
                                {isUp ? (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                                )}
                                <span className={isUp ? 'text-emerald-600' : 'text-rose-600'}>
                                  {formatCurrency(inv.currentPrice)}
                                </span>
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`font-bold block ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isUp ? '+' : ''}{formatCurrency(pnl)}
                              </span>
                              <span className={`text-[10px] font-semibold mt-0.5 block ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isUp ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border
                                  ${
                                    inv.investmentType === 'Stock'
                                      ? 'bg-purple-50 text-purple-600 border-purple-100'
                                      : inv.investmentType === 'Mutual Fund'
                                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                                      : 'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}
                              >
                                {inv.investmentType}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Portfolio 30d performance chart */}
        <GlassCard className="bg-white border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-900">Portfolio Performance (30 Days)</h2>
          </div>

          {investments.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-12">Add stock investments to generate performance index.</p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#0f172a',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Portfolio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#perfGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Watchlist */}
        <GlassCard className="bg-white border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900">Market Watchlist</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {watchlist.map((stock) => {
              const isUp = stock.changePct >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200 transition-colors shadow-inner"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-800">{stock.symbol}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{formatCurrency(stock.currentPrice)}</p>
                    <span
                      className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isUp ? '+' : ''}{stock.changePct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Buy Stock Modal */}
      <AnimatePresence>
        {showModal && <BuyStockModal onClose={() => setShowModal(false)} addInvestment={addInvestment} />}
      </AnimatePresence>
    </div>
  );
}

// modal component
interface BuyStockModalProps {
  onClose: () => void;
  addInvestment: (inv: Omit<import('../../utils/mockData').Investment, 'id' | 'updatedAt'>) => Promise<import('../../utils/mockData').Investment>;
}

function BuyStockModal({ onClose, addInvestment }: BuyStockModalProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(availableStocks[0].symbol);
  const [quantity, setQuantity] = useState(1);
  const [investmentType, setInvestmentType] = useState<'Stock' | 'Mutual Fund' | 'Gold'>('Stock');
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedStock = availableStocks.find((s) => s.symbol === selectedSymbol) ?? availableStocks[0];
  const totalCost = selectedStock.currentPrice * quantity;

  const handleSubmit = async () => {
    if (quantity <= 0) return;
    setSubmitting(true);
    try {
      await addInvestment({
        stockSymbol: selectedStock.symbol,
        stockName: selectedStock.name,
        quantity,
        buyPrice: selectedStock.currentPrice,
        currentPrice: selectedStock.currentPrice,
        investmentType,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

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
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Buy Stock</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Select */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase tracking-wide">
            Select Stock
          </label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200
                hover:border-purple-300 transition-colors text-xs text-slate-750 cursor-pointer shadow-inner"
            >
              <span>
                <span className="font-bold">{selectedStock.symbol}</span>{' '}
                <span className="text-slate-400">— {selectedStock.name}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl
                    bg-white border border-slate-200 shadow-lg text-slate-800"
                >
                  {availableStocks.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        setSelectedSymbol(s.symbol);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer
                        ${s.symbol === selectedSymbol ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-650'}`}
                    >
                      <span>
                        <span className="font-bold">{s.symbol}</span>{' '}
                        <span className="text-slate-400 text-[10px]">{s.name}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{formatCurrency(s.currentPrice)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CMP */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase tracking-wide">
            Buy Price
          </label>
          <input
            type="text"
            readOnly
            value={formatCurrency(selectedStock.currentPrice)}
            className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-250 text-xs text-slate-500 cursor-not-allowed font-semibold shadow-inner"
          />
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase tracking-wide">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800
              focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Investment Type */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase tracking-wide">
            Investment Type
          </label>
          <div className="flex gap-2">
            {(['Stock', 'Mutual Fund', 'Gold'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setInvestmentType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer
                  ${
                    investmentType === t
                      ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-100'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Total Cost */}
        <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-inner">
          <span className="text-xs text-slate-500 font-semibold">Total Cost</span>
          <span className="text-base font-extrabold text-slate-800 font-mono">{formatCurrency(totalCost)}</span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all cursor-pointer"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing…
            </span>
          ) : (
            `Buy ${selectedStock.symbol} — ${formatCurrency(totalCost)}`
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
