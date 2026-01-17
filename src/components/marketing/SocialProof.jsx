import React from 'react';
import { Users, Building2, Star } from 'lucide-react';

export default function SocialProof() {
  const stats = [
    { icon: Users, value: '2.500+', label: 'Vermieter' },
    { icon: Building2, value: '8.000+', label: 'Objekte' },
    { icon: Star, value: '4,9/5', label: 'Bewertung' }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 py-8">
      {stats.map((stat) => {
        const StatIcon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3">
            <StatIcon className="h-5 w-5 text-[var(--vf-primary-600)]" />
            <div>
              <div className="text-2xl font-bold text-[var(--vf-primary-600)]">{stat.value}</div>
              <div className="text-sm text-[var(--theme-text-muted)]">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}