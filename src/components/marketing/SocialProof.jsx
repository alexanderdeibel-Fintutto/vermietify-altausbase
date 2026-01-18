import React from 'react';
import { Users, Star, Award } from 'lucide-react';

export default function SocialProof() {
  const stats = [
    { icon: Users, value: '5.000+', label: 'Aktive Nutzer' },
    { icon: Star, value: '4.9/5', label: 'Bewertung' },
    { icon: Award, value: '15.000+', label: 'Verwaltete Objekte' }
  ];

  return (
    <div className="bg-[var(--theme-surface)] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <stat.icon className="h-8 w-8 mx-auto mb-3 text-[var(--theme-primary)]" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--theme-text-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}