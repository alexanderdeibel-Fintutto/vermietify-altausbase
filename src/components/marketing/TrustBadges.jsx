import React from 'react';
import { Shield, Lock, CheckCircle } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    { icon: Shield, text: 'DSGVO-konform' },
    { icon: Lock, text: 'SSL-verschlüsselt' },
    { icon: CheckCircle, text: 'GoBD-zertifiziert' }
  ];

  return (
    <div className="flex justify-center gap-8 py-8">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
          <badge.icon className="h-5 w-5 text-[var(--theme-primary)]" />
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}