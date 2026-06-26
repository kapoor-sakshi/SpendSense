'use client';

import React from 'react';
import { ReportStatus } from '../utils/reportTypes';

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600 border-slate-200',
  'Collecting Data': 'bg-blue-50 text-blue-700 border-blue-200',
  Analyzing: 'bg-amber-50 text-amber-700 border-amber-200',
  Generated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Progress': 'bg-purple-50 text-purple-700 border-purple-200'
};

export const ReportStatusChip: React.FC<{ status: ReportStatus | string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm'
}) => (
  <span
    className={`inline-flex items-center font-semibold border rounded-full ${
      STATUS_STYLES[status] || STATUS_STYLES.Pending
    } ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}
  >
    {status}
  </span>
);

export default ReportStatusChip;
