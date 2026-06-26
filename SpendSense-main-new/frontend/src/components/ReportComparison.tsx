'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ReportComparison as ComparisonData, formatCurrency } from '../utils/reportTypes';
import { GlassCard } from './GlassCard';

const ChangeIndicator: React.FC<{ value: number; suffix?: string; invert?: boolean }> = ({
  value, suffix = '%', invert = false
}) => {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className={`flex items-center gap-1 text-sm font-bold ${color}`}>
      <Icon className="w-4 h-4" />
      {value > 0 ? '+' : ''}{value}{suffix}
    </div>
  );
};

export const ReportComparisonPanel: React.FC<{
  comparison: ComparisonData;
  currentLabel: string;
  previousLabel: string;
}> = ({ comparison, currentLabel, previousLabel }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <GlassCard className="bg-white">
        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Spending</p>
        <ChangeIndicator value={comparison.spendingChange} invert />
        <p className="text-[10px] text-slate-400 mt-1">vs previous month</p>
      </GlassCard>
      <GlassCard className="bg-white">
        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Savings</p>
        <ChangeIndicator value={comparison.savingsChange} />
        <p className="text-[10px] text-slate-400 mt-1">vs previous month</p>
      </GlassCard>
      <GlassCard className="bg-white">
        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Investment</p>
        <ChangeIndicator value={comparison.investmentGrowth} suffix=" pts" />
        <p className="text-[10px] text-slate-400 mt-1">growth delta</p>
      </GlassCard>
      <GlassCard className="bg-white">
        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Loan Reduction</p>
        <ChangeIndicator value={comparison.loanReduction} />
        <p className="text-[10px] text-slate-400 mt-1">principal paid</p>
      </GlassCard>
      <GlassCard className="bg-white">
        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">EMI Change</p>
        <div className="text-sm font-bold text-slate-800">
          {comparison.emiChange >= 0 ? '+' : ''}{formatCurrency(comparison.emiChange)}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">monthly delta</p>
      </GlassCard>
    </div>

    <GlassCard className="bg-white">
      <h3 className="text-sm font-bold text-slate-900 mb-4">
        {currentLabel} vs {previousLabel}
      </h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparison.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: '12px', fontSize: '11px'
              }}
              formatter={(v: number) => [formatCurrency(v)]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="current" name={currentLabel} fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="previous" name={previousLabel} fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  </div>
);

export default ReportComparisonPanel;
