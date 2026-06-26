'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Download, Sparkles, TrendingUp, Building, CreditCard,
  ShieldCheck, DollarSign, Tv, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useApp } from '../../../../context/AppContext';
import { GlassCard } from '../../../../components/GlassCard';
import { ReportStatusChip } from '../../../../components/ReportStatusChip';
import { StoredReport, formatCurrency, formatReportDate } from '../../../../utils/reportTypes';
import { exportToPDF } from '../../../../utils/exports';

const COLORS = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const { getReportById, transactions } = useApp();
  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        const data = await getReportById(id);
        setReport(data);
      }
      setLoading(false);
    }
    load();
  }, [id, getReportById]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Report Not Found</h2>
        <Link href="/reports/history" className="text-purple-600 text-sm font-semibold">← Back to History</Link>
      </div>
    );
  }

  const categoryData = Object.entries(report.categoryAnalysis || {}).map(([name, value]) => ({ name, value }));
  const spend = report.totalSpend || report.spendingSummary?.totalExpense || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/reports/history" className="text-xs text-purple-600 font-semibold flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Report History
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{report.reportMonth} Report</h1>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {formatReportDate(report.generatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ReportStatusChip status={report.status} size="md" />
            <button
              onClick={() => exportToPDF(transactions, {
                financialSummary: report.financialSummary,
                highestSpendingCategory: report.highestSpendingCategory,
                savingsAmount: report.savingsAmount,
                emiBurdenPercentage: report.emiBurdenPercentage,
                subscriptionWasteAmount: report.subscriptionWasteAmount
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-purple-600" /> Download PDF
            </button>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Spend', value: formatCurrency(spend), icon: TrendingUp, color: 'text-purple-600' },
            { label: 'Income', value: formatCurrency(report.spendingSummary?.totalIncome || 0), icon: DollarSign, color: 'text-blue-600' },
            { label: 'Savings', value: formatCurrency(report.savingsAmount), icon: TrendingUp, color: 'text-emerald-600' },
            { label: 'Health Score', value: `${report.financialHealthScore}/100`, icon: Sparkles, color: 'text-indigo-600' },
            { label: 'EMI Burden', value: `${report.emiBurdenPercentage}%`, icon: DollarSign, color: 'text-amber-600' }
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <GlassCard key={i} className="bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">{m.label}</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{m.value}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {report.chartData?.timeline && report.chartData.timeline.length > 0 && (
            <GlassCard className="bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Spending Timeline</h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.chartData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="expense" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {categoryData.length > 0 && (
            <GlassCard className="bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Category Breakdown</h3>
              <div className="h-[240px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Analysis sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GlassCard className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800">Bank Analysis</h4>
            </div>
            {Object.entries(report.bankAnalysis || {}).map(([bank, vals]) => (
              <div key={bank} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{bank}</span>
                <span className="font-semibold">{formatCurrency(vals.outflow)} out</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-800">UPI Analysis</h4>
            </div>
            {Object.entries(report.UPIAnalysis || {}).map(([upi, vals]) => (
              <div key={upi} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                <span className="text-slate-600 truncate max-w-[60%]">{upi}</span>
                <span className="font-semibold">{formatCurrency(vals.totalSpent)}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-800">Loan Analysis</h4>
            </div>
            <p className="text-xs text-slate-600">Active Loans: <strong>{report.loanAnalysis?.activeLoans || 0}</strong></p>
            <p className="text-xs text-slate-600">Total EMI: <strong>{formatCurrency(report.loanAnalysis?.totalEmi || 0)}</strong></p>
            <p className="text-xs text-slate-600">Remaining: <strong>{formatCurrency(report.loanAnalysis?.totalRemaining || 0)}</strong></p>
          </GlassCard>

          <GlassCard className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">Insurance</h4>
            </div>
            <p className="text-xs text-slate-600">Policies: <strong>{report.insuranceAnalysis?.activePolicies || 0}</strong></p>
            <p className="text-xs text-slate-600">Coverage: <strong>{formatCurrency(report.insuranceAnalysis?.totalCoverage || 0)}</strong></p>
          </GlassCard>

          <GlassCard className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800">Investments</h4>
            </div>
            <p className="text-xs text-slate-600">Portfolio: <strong>{formatCurrency(report.investmentAnalysis?.currentValue || 0)}</strong></p>
            <p className="text-xs text-slate-600">P/L: <strong className={report.investmentAnalysis?.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {formatCurrency(report.investmentAnalysis?.profitLoss || 0)} ({report.investmentAnalysis?.profitPercent || 0}%)
            </strong></p>
          </GlassCard>

          <GlassCard className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Tv className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-slate-800">Subscriptions</h4>
            </div>
            <p className="text-xs text-slate-600">Monthly Cost: <strong>{formatCurrency(report.subscriptionsAnalysis?.monthlyCost || 0)}</strong></p>
            <p className="text-xs text-slate-600">Wasted: <strong className="text-red-600">{formatCurrency(report.subscriptionWasteAmount)}</strong></p>
          </GlassCard>
        </div>

        {/* AI Narrative */}
        <GlassCard glowColor="purple" className="bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Financial Summary</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {report.financialSummary}
          </p>

          {report.overspendingWarnings?.length > 0 && (
            <div className="mt-4 space-y-2">
              {report.overspendingWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.suggestions?.map((s, i) => (
              <div key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-purple-600 mr-1">{i + 1}.</span> {s}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
