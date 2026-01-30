import React from 'react';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Trophy, Star, Zap, Award, Target, Flame } from 'lucide-react';
import HelpIcon from '../ui/HelpIcon';

const BADGE_TYPES = {
  beginner: { icon: Star, color: 'bg-blue-100 text-blue-800', label: 'Anfänger' },
  intermediate: { icon: Zap, color: 'bg-purple-100 text-purple-800', label: 'Fortgeschritten' },
  expert: { icon: Trophy, color: 'bg-amber-100 text-amber-800', label: 'Experte' },
  speedster: { icon: Flame, color: 'bg-red-100 text-red-800', label: 'Schnellig' },
  accuracy: { icon: Target, color: 'bg-green-100 text-green-800', label: 'Genau' },
  collector: { icon: Award, color: 'bg-pink-100 text-pink-800', label: 'Sammler' }
};

export default function BadgeDisplay({ badges = [], interactive = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const config = BADGE_TYPES[badge.type] || BADGE_TYPES.beginner;
        const Icon = config.icon;

        return (
          <div key={badge.id} className="inline-flex items-center gap-1 group">
            <div className={`${config.color} p-2 rounded-lg inline-flex items-center gap-1 border`}>
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold">{config.label}</span>
            </div>
            {interactive && badge.description && (
              <HelpIcon content={badge.description} />
            )}
          </div>
        );
      })}
    </div>
  );
}