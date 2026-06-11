'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Search,
  Clock,
  CircleDot
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';
import { availableStocks } from '../../utils/mockData';
import { LiveStockTicker } from '../../components/LiveStockTicker';

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

interface LiveStock {
  symbol: string;
  name: string;
  open: number;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  flash?: 'up' | 'down' | null;
  history: number[];
}

export default function InvestmentsPage() {
  const { investments, addInvestment } = useApp();
  const [showModal, setShowModal] = useState(false);
  
  // Real-time Stock Engine State
  const [liveStocks, setLiveStocks] = useState<LiveStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Initialize live stocks
  useEffect(() => {
    const initialLive = availableStocks.map((stock, idx) => {
      // Simulate an opening price slightly different from current to show daily change
      const drift = (seededRandom(idx * 17) - 0.5) * stock.currentPrice * 0.02;
      const open = stock.currentPrice - drift;
      const change = stock.currentPrice - open;
      return {
        symbol: stock.symbol,
        name: stock.name,
        open: open,
        price: stock.currentPrice,
        change: change,
        changePct: (change / open) * 100,
        high: Math.max(open, stock.currentPrice) * 1.005,
        low: Math.min(open, stock.currentPrice) * 0.995,
        volume: Math.floor(10000 + seededRandom(idx * 31) * 500000),
        history: Array(20).fill(0).map((_, i) => open + (change / 20) * i),
        flash: null
      };
    });
    setLiveStocks(initialLive);

    // Check market hours (9:15 AM to 3:30 PM IST)
    const checkMarketStatus = () => {
      const now = new Date();
      // Simple approximation for demo: open 9 AM to 4 PM
      const hours = now.getHours();
      setIsMarketOpen(hours >= 9 && hours < 16 && now.getDay() !== 0 && now.getDay() !== 6);
    };
    checkMarketStatus();
    const timeInterval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  // Price Fluctuation Engine
  useEffect(() => {
    if (!isMarketOpen || liveStocks.length === 0) return;

    const interval = setInterval(() => {
      setLiveStocks(prev => prev.map(stock => {
        // Only update some stocks per tick to look more realistic
        if (Math.random() > 0.4) return { ...stock, flash: null };

        const volatility = stock.price * 0.002; // max 0.2% change per tick
        const changeAmt = (Math.random() - 0.48) * volatility; // slight upward bias
        let newPrice = stock.price + changeAmt;
        
        // Prevent dropping below 1
        if (newPrice < 1) newPrice = 1;

        const newChange = newPrice - stock.open;
        const newChangePct = (newChange / stock.open) * 100;
        
        const newHistory = [...stock.history.slice(1), newPrice];

        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePct: newChangePct,
          high: Math.max(stock.high, newPrice),
          low: Math.min(stock.low, newPrice),
          volume: stock.volume + Math.floor(Math.random() * 500),
          flash: changeAmt > 0 ? 'up' : 'down',
          history: newHistory
        };
      }));
    }, 2500); // Update every 2.5s

    return () => clearInterval(interval);
  }, [isMarketOpen, liveStocks.length]);

  // Portfolio aggregates
  const totalInvested = useMemo(
    () => investments.reduce((s, i) => s + i.quantity * i.buyPrice, 0),
    [investments]
  );
  
  // Use live prices for current value if available
  const currentValue = useMemo(() => {
    return investments.reduce((sum, inv) => {
      const liveData = liveStocks.find(s => s.symbol === inv.stockSymbol);
      const price = liveData ? liveData.price : inv.currentPrice;
      return sum + (inv.quantity * price);
    }, 0);
  }, [investments, liveStocks]);

  const totalPnL = currentValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPnlPositive = totalPnL >= 0;

  // Pie chart data
  const pieData = useMemo(
    () =>
      investments.map((inv) => {
        const liveData = liveStocks.find(s => s.symbol === inv.stockSymbol);
        const price = liveData ? liveData.price : inv.currentPrice;
        return {
          name: inv.stockSymbol,
          value: inv.quantity * price,
        };
      }),
    [investments, liveStocks]
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

  // Filtered live stocks
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return liveStocks;
    const lowerQ = searchQuery.toLowerCase();
    return liveStocks.filter(s => 
      s.symbol.toLowerCase().includes(lowerQ) || 
      s.name.toLowerCase().includes(lowerQ)
    );
  }, [liveStocks, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 flex flex-col overflow-x-hidden w-full">
      {/* Live Ticker Bar at the very top */}
      <LiveStockTicker stocks={liveStocks} />

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-200/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-blue-100/15 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 flex-1 w-full">
        
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
                Track your portfolio, monitor live stock markets, and manage investments.
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
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
              Live market sync
            </div>
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

        {/* Live Market Exchange Section */}
        <div className="mt-8">
          <GlassCard className="bg-white border-slate-200/80 shadow-sm w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Live Market Feed</h2>
                  
                  {/* Market Status Badge */}
                  <div className={`ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isMarketOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {isMarketOpen ? (
                      <>
                        <CircleDot className="w-3 h-3 animate-pulse-dot text-emerald-500" />
                        Market Open
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Market Closed
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Real-time simulated NSE/BSE stock prices and volume.</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search NSE/BSE stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs relative">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="text-left py-3 pl-2">Symbol</th>
                    <th className="text-right py-3">LTP (₹)</th>
                    <th className="text-right py-3">Change</th>
                    <th className="text-right py-3">Volume</th>
                    <th className="text-right py-3">Day H/L</th>
                    <th className="text-right py-3 pr-2 hidden sm:table-cell">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-numeric">
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No stocks found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock) => {
                      const isUp = stock.change >= 0;
                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3 pl-2">
                            <span className="font-bold text-slate-900 block">{stock.symbol}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[150px]">{stock.name}</span>
                          </td>
                          
                          <td className="py-3 text-right">
                            <span className={`inline-block px-2 py-1 rounded transition-colors duration-500 font-bold text-slate-800
                              ${stock.flash === 'up' ? 'flash-up' : ''}
                              ${stock.flash === 'down' ? 'flash-down' : ''}
                            `}>
                              {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          
                          <td className="py-3 text-right">
                            <span className={`flex items-center justify-end gap-0.5 font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isUp ? '+' : ''}{stock.change.toFixed(2)}
                            </span>
                            <span className={`text-[10px] font-semibold block mt-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
                            </span>
                          </td>

                          <td className="py-3 text-right text-slate-600 font-medium">
                            {(stock.volume / 1000).toFixed(1)}k
                          </td>

                          <td className="py-3 text-right text-[10px] text-slate-500">
                            <div className="flex flex-col gap-0.5 items-end">
                              <span>H: {stock.high.toFixed(1)}</span>
                              <span>L: {stock.low.toFixed(1)}</span>
                            </div>
                          </td>

                          <td className="py-3 text-right pr-2 hidden sm:table-cell w-24">
                            <div className="h-8 w-20 ml-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stock.history.map((v, i) => ({ i, v }))}>
                                  <Line 
                                    type="monotone" 
                                    dataKey="v" 
                                    stroke={isUp ? '#10b981' : '#e11d48'} 
                                    strokeWidth={1.5} 
                                    dot={false}
                                    isAnimationActive={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                          <RechartsTooltip
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
                <h2 className="text-sm font-semibold text-slate-900">Your Holdings</h2>
              </div>

              {investments.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-4">
                  <Briefcase className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                  <p className="text-xs text-slate-500">No holdings. Click Buy Stock to purchase shares.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-numeric">
                    <thead>
                      <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                        <th className="text-left pb-3">Stock</th>
                        <th className="text-right pb-3">Qty</th>
                        <th className="text-right pb-3">Buy Price</th>
                        <th className="text-right pb-3">CMP (Live)</th>
                        <th className="text-right pb-3">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investments.map((inv) => {
                        const liveData = liveStocks.find(s => s.symbol === inv.stockSymbol);
                        const currentPrice = liveData ? liveData.price : inv.currentPrice;
                        
                        const pnl = (currentPrice - inv.buyPrice) * inv.quantity;
                        const pnlPercent =
                          inv.buyPrice > 0 ? ((currentPrice - inv.buyPrice) / inv.buyPrice) * 100 : 0;
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
                                  {formatCurrency(currentPrice)}
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
      </div>

      {/* Buy Stock Modal */}
      <AnimatePresence>
        {showModal && <BuyStockModal onClose={() => setShowModal(false)} addInvestment={addInvestment} liveStocks={liveStocks} />}
      </AnimatePresence>
    </div>
  );
}

// modal component
interface BuyStockModalProps {
  onClose: () => void;
  addInvestment: (inv: Omit<import('../../utils/mockData').Investment, 'id' | 'updatedAt'>) => Promise<import('../../utils/mockData').Investment>;
  liveStocks: LiveStock[];
}

function BuyStockModal({ onClose, addInvestment, liveStocks }: BuyStockModalProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(availableStocks[0].symbol);
  const [quantity, setQuantity] = useState(1);
  const [investmentType, setInvestmentType] = useState<'Stock' | 'Mutual Fund' | 'Gold'>('Stock');
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedStock = availableStocks.find((s) => s.symbol === selectedSymbol) ?? availableStocks[0];
  const liveData = liveStocks.find(s => s.symbol === selectedSymbol);
  const currentPrice = liveData ? liveData.price : selectedStock.currentPrice;
  const totalCost = currentPrice * quantity;

  const handleSubmit = async () => {
    if (quantity <= 0) return;
    setSubmitting(true);
    try {
      await addInvestment({
        stockSymbol: selectedStock.symbol,
        stockName: selectedStock.name,
        quantity,
        buyPrice: currentPrice,
        currentPrice: currentPrice,
        investmentType,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDropdownStocks = availableStocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span className="truncate pr-2 text-left">
                <span className="font-bold">{selectedStock.symbol}</span>{' '}
                <span className="text-slate-400">— {selectedStock.name}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute z-20 mt-1 w-full rounded-xl bg-white border border-slate-200 shadow-lg text-slate-800 flex flex-col"
                >
                  <div className="p-2 border-b border-slate-100">
                    <input 
                      type="text" 
                      placeholder="Search stock..." 
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDropdownStocks.map((s) => {
                      const liveS = liveStocks.find(ls => ls.symbol === s.symbol);
                      const displayPrice = liveS ? liveS.price : s.currentPrice;
                      return (
                        <button
                          key={s.symbol}
                          onClick={() => {
                            setSelectedSymbol(s.symbol);
                            setDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer
                            ${s.symbol === selectedSymbol ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-650'}`}
                        >
                          <span className="truncate pr-2">
                            <span className="font-bold">{s.symbol}</span>{' '}
                            <span className="text-slate-400 text-[10px]">{s.name}</span>
                          </span>
                          <span className="text-xs text-slate-500 font-mono shrink-0">{formatCurrency(displayPrice)}</span>
                        </button>
                      );
                    })}
                    {filteredDropdownStocks.length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">No stocks found</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CMP */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-405 mb-1.5 uppercase tracking-wide">
            Live Market Price
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={formatCurrency(currentPrice)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-250 text-xs text-slate-500 cursor-not-allowed font-semibold shadow-inner pl-9"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full block animate-pulse-dot" />
            </div>
          </div>
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
