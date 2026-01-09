import React from 'react';
import { Card } from "@/components/ui/card";

export default function QuickStats({ stats, accentColor = 'purple' }) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-6 border border-slate-100 bg-white shadow-none">
          <p className="text-xs font-extralight text-slate-400 tracking-wide">{stat.label}</p>
          <p className="text-3xl font-extralight text-slate-700 mt-3">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}