'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Calendar, FileText, TrendingUp, History, ChevronRight, CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { ReportStatusChip } from './ReportStatusChip';
import { ReportTimeline } from './ReportTimeline';
import { formatCurrency, formatReportDate } from '../utils/reportTypes';

export const DashboardReportSection: React.FC = () => {
  const {
    reportStats, reportTimeline, fetchReportStats, fetchReportTimeline, loading
  } = useApp();

  useEffect(() => {
    fetchReportStats();
    fetchReportTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !reportStats) return null;

  const ds = reportStats.dataSources;

  return (
    <div className="space-y-6">
      {/* Current Analysis Period */}
      <GlassCard glowColor="purple" className="bg-white border-slate-200/80 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Current Analysis Period</h3>
              <ReportStatusChip status={reportStats.currentStatus} />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Currently Analyzing: <span className="font-bold text-slate-800">{reportStats.currentAnalysisMonth}</span>
            </p>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {ds.bankAccounts} Bank Account{ds.bankAccounts !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {ds.upiAccounts} UPI Account{ds.upiAccounts !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {ds.billsUploaded} Bill{ds.billsUploaded !== 1 ? 's' : ''} Uploaded
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {ds.activeLoans} Active Loan{ds.activeLoans !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5" />
              Current Report Month: {reportStats.currentAnalysisMonth}
            </span>
            <Link
              href="/reports/history"
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              View Report History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* Report Widgets Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Analysis Month</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{reportStats.currentAnalysisMonth}</p>
        </GlassCard>

        <GlassCard className="bg-white">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Last Generated</span>
          </div>
          {reportStats.lastGeneratedReport ? (
            <>
              <p className="text-sm font-bold text-slate-900">{reportStats.lastGeneratedReport.reportMonth}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {formatReportDate(reportStats.lastGeneratedReport.generatedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No reports yet</p>
          )}
        </GlassCard>

        <GlassCard className="bg-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Next Generation</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{reportStats.nextReportDate}</p>
        </GlassCard>

        <GlassCard className="bg-white">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Report History</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{reportStats.reportHistoryCount} Reports</p>
          <Link href="/reports/history" className="text-[10px] text-purple-600 font-semibold mt-1 inline-block">
            Browse all →
          </Link>
        </GlassCard>
      </div>

      {/* Timeline + Health Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="bg-white">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Report Timeline</h3>
          <ReportTimeline timeline={reportTimeline} compact />
        </GlassCard>

        <GlassCard className="bg-white">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Financial Health Trend</h3>
          {reportStats.healthTrend.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportStats.healthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff', border: '1px solid #e2e8f0',
                      borderRadius: '12px', fontSize: '11px'
                    }}
                  />
                  <Line
                    type="monotone" dataKey="score" stroke="#7c3aed"
                    strokeWidth={2} dot={{ r: 4, fill: '#7c3aed' }}
                    name="Health Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">
              Generate your first report to see health trends
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardReportSection;
