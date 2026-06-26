'use client';

import React from 'react';
import { CheckCircle2, Clock, Loader2, Circle } from 'lucide-react';
import { TimelineEntry } from '../utils/reportTypes';
import Link from 'next/link';

const statusIcon = (status: string) => {
  switch (status) {
    case 'Generated':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'In Progress':
      return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />;
    case 'Analyzing':
      return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
  }
  return <Circle className="w-4 h-4 text-slate-300" />;
};

export const ReportTimeline: React.FC<{
  timeline: TimelineEntry[];
  compact?: boolean;
}> = ({ timeline, compact = false }) => {
  const display = compact ? timeline.filter(t => {
    const now = new Date();
    return t.year === now.getFullYear() && t.month <= now.getMonth() + 2;
  }).slice(-6) : timeline;

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-200 via-slate-200 to-transparent" />
      <div className="space-y-3">
        {display.map((entry) => (
          <div key={`${entry.year}-${entry.month}`} className="flex items-start gap-3 relative">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm">
              {statusIcon(entry.status)}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {entry.reportMonth.split(' ')[0].slice(0, 3)} {entry.year}
                </span>
                <span className={`text-[10px] font-semibold ${
                  entry.status === 'Generated' ? 'text-emerald-600' :
                  entry.status === 'In Progress' ? 'text-purple-600' : 'text-slate-400'
                }`}>
                  {entry.status === 'Generated' ? 'Generated' : entry.status}
                </span>
              </div>
              {!compact && entry.totalSpend != null && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Total Spend: ₹{entry.totalSpend.toLocaleString('en-IN')}
                </p>
              )}
              {entry.reportId && (
                <Link
                  href={`/reports/view/${entry.reportId}`}
                  className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold mt-0.5 inline-block"
                >
                  View Report →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportTimeline;
