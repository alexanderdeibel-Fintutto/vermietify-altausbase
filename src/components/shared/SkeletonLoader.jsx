import React from 'react';
import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-20 bg-slate-200 rounded" />
      <div className="flex gap-2">
        <div className="h-8 bg-slate-200 rounded w-24" />
        <div className="h-8 bg-slate-200 rounded w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 p-4 flex gap-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded flex-1" />
        <div className="h-4 bg-slate-200 rounded flex-1" />
        <div className="h-4 bg-slate-200 rounded flex-1" />
        <div className="h-4 bg-slate-200 rounded w-20" />
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="border-b border-slate-100 p-4 flex gap-4 animate-pulse">
          <div className="h-4 bg-slate-100 rounded flex-1" />
          <div className="h-4 bg-slate-100 rounded flex-1" />
          <div className="h-4 bg-slate-100 rounded flex-1" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
          <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
          <div className="h-8 bg-slate-200 rounded w-32" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', rows }) {
  if (type === 'table') return <SkeletonTable rows={rows} />;
  if (type === 'stats') return <SkeletonStats />;
  return <SkeletonCard />;
}