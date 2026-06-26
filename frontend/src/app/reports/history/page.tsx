'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History, Filter, Download, Eye, GitCompare, FileText, ChevronRight, Calendar
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { GlassCard } from '../../../components/GlassCard';
import { ReportStatusChip } from '../../../components/ReportStatusChip';
import { ReportTimeline } from '../../../components/ReportTimeline';
import { ReportComparisonPanel } from '../../../components/ReportComparison';
import {
  StoredReport, MONTH_NAMES, formatCurrency, formatReportDate
} from '../../../utils/reportTypes';
import { exportToPDF } from '../../../utils/exports';

export default function ReportHistoryPage() {
  const {
    reportHistory, reportTimeline, fetchReportHistory, fetchReportTimeline,
    compareReports, transactions
  } = useApp();

  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedReports, setSelectedReports] = useState<StoredReport[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchReportHistory(
        filterYear,
        filterMonth !== '' ? filterMonth : undefined
      );
      await fetchReportTimeline(filterYear);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterMonth]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const toggleSelect = (report: StoredReport) => {
    if (!compareMode) return;
    setSelectedReports(prev => {
      const exists = prev.find(r => r.id === report.id);
      if (exists) return prev.filter(r => r.id !== report.id);
      if (prev.length >= 2) return [prev[1], report];
      return [...prev, report];
    });
  };

  const runComparison = async () => {
    if (selectedReports.length !== 2) return;
    const [a, b] = selectedReports.sort((x, y) =>
      x.year !== y.year ? x.year - y.year : x.month - y.month
    );
    const result = await compareReports(b.month, b.year, a.month, a.year);
    setComparison(result);
  };

  const handleDownload = (report: StoredReport) => {
    exportToPDF(transactions, {
      financialSummary: report.financialSummary,
      highestSpendingCategory: report.highestSpendingCategory,
      savingsAmount: report.savingsAmount,
      emiBurdenPercentage: report.emiBurdenPercentage,
      subscriptionWasteAmount: report.subscriptionWasteAmount
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <History className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Report History</h1>
            </div>
            <p className="text-slate-500 text-xs ml-1">
              Bank statement-style archive of all AI-generated monthly financial reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/reports"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Generate New Report
            </Link>
            <button
              onClick={() => { setCompareMode(!compareMode); setSelectedReports([]); setComparison(null); }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold shadow-sm transition-all ${
                compareMode
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              Compare Reports
            </button>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="bg-white">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <option value="">All Months</option>
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            {compareMode && selectedReports.length === 2 && (
              <button
                onClick={runComparison}
                className="ml-auto px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Compare Selected
              </button>
            )}
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline sidebar */}
          <div className="lg:col-span-1">
            <GlassCard className="bg-white sticky top-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                {filterYear} Timeline
              </h3>
              <ReportTimeline timeline={reportTimeline} />
            </GlassCard>
          </div>

          {/* Report list */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-center py-16 text-slate-400 text-sm">Loading report history...</div>
            ) : reportHistory.length === 0 ? (
              <GlassCard className="bg-white text-center py-16">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-800 mb-2">No Reports Generated Yet</h3>
                <p className="text-xs text-slate-500 mb-4">Generate your first AI report to start building history.</p>
                <Link href="/reports" className="text-purple-600 text-xs font-semibold">Go to Reports →</Link>
              </GlassCard>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3">Period</div>
                  <div className="col-span-2">Total Spend</div>
                  <div className="col-span-2">Savings</div>
                  <div className="col-span-2">Health Score</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {reportHistory.map((report) => {
                  const isSelected = selectedReports.some(r => r.id === report.id);
                  const spend = report.totalSpend || report.spendingSummary?.totalExpense || 0;
                  const savings = report.spendingSummary?.netSavings || report.savingsAmount || 0;

                  return (
                    <GlassCard
                      key={report.id || `${report.year}-${report.month}`}
                      className={`bg-white transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-indigo-400 border-indigo-200' : 'hover:border-slate-300'
                      }`}
                      onClick={() => compareMode && toggleSelect(report)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-3">
                          <p className="text-sm font-bold text-slate-900">{report.reportMonth}</p>
                          <p className="text-[10px] text-slate-500">
                            Generated: {formatReportDate(report.generatedAt)}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-500 md:hidden">Total Spend</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(spend)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-500 md:hidden">Savings</p>
                          <p className="text-sm font-bold text-emerald-600">{formatCurrency(savings)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-500 md:hidden">Health Score</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                style={{ width: `${report.financialHealthScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{report.financialHealthScore}</span>
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <ReportStatusChip status={report.status} />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <Link
                            href={`/reports/view/${report.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                            title="View Report"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(report); }}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </>
            )}

            {/* Comparison results */}
            {comparison && selectedReports.length === 2 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Month-over-Month Comparison</h3>
                <ReportComparisonPanel
                  comparison={comparison}
                  currentLabel={selectedReports[1].reportMonth}
                  previousLabel={selectedReports[0].reportMonth}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
