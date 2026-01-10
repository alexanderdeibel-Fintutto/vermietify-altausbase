import React from 'react';
import { Loader2 } from 'lucide-react';

export const CardSkeleton = () => (
  <div className="p-6 bg-white rounded-lg border border-slate-200">
    <div className="space-y-3">
      <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
      <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array(rows).fill(0).map((_, i) => (
      <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
    ))}
  </div>
);

export const LoadingSpinner = ({ text = 'Lädt...' }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-8">
    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    <p className="text-sm text-slate-600">{text}</p>
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
);