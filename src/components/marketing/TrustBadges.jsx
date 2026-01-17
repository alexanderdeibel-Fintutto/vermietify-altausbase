import React from 'react';
import { Shield, Lock, Server, Award } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    { icon: Shield, label: 'DSGVO-konform' },
    { icon: Lock, label: 'SSL-verschlüsselt' },
    { icon: Server, label: 'Server in DE' },
    { icon: Award, label: '4,9/5 Bewertung' }
  ];

  return (
    <div className="vf-trust-badges">
      {badges.map((badge) => {
        const BadgeIcon = badge.icon;
        return (
          <div key={badge.label} className="vf-trust-badge">
            <BadgeIcon className="h-4 w-4" />
            {badge.label}
          </div>
        );
      })}
    </div>
  );
}