import React from 'react';
import { Card } from "@/components/ui/card";

export default function QuickStats({ stats, accentColor = 'purple' }) {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <Card key={idx} className={`p-4 border ${colorMap[accentColor]}`}>
          <p className="text-sm font-normal opacity-75">{stat.label}</p>
          <p className="text-2xl font-light mt-1">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}