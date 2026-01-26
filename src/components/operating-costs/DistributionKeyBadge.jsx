import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Ruler, Users, Home, Flame, Pin, Activity } from 'lucide-react';

export default function DistributionKeyBadge({ distributionKey, className = '' }) {
  const config = {
    'Flaeche': { icon: Ruler, label: 'Fläche', color: 'bg-blue-100 text-blue-700' },
    'Personen': { icon: Users, label: 'Personen', color: 'bg-purple-100 text-purple-700' },
    'Einheiten': { icon: Home, label: 'Einheiten', color: 'bg-green-100 text-green-700' },
    'HeizkostenV': { icon: Flame, label: 'HeizkostenV', color: 'bg-orange-100 text-orange-700' },
    'direkt': { icon: Pin, label: 'Direkt', color: 'bg-pink-100 text-pink-700' },
    'Verbrauch': { icon: Activity, label: 'Verbrauch', color: 'bg-indigo-100 text-indigo-700' }
  };

  const { icon: Icon, label, color } = config[distributionKey] || config['Flaeche'];

  return (
    <Badge className={`${color} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}