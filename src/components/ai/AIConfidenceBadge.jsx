import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import HelpIcon from '../ui/HelpIcon';

export default function AIConfidenceBadge({ confidence, reasoning }) {
  const getColor = () => {
    if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <div className="inline-flex items-center gap-1">
      <Badge className={`${getColor()} border`}>
        <Sparkles className="w-3 h-3 mr-1" />
        KI-Vorschlag ({confidence}%)
      </Badge>
      {reasoning && (
        <HelpIcon
          title="Warum dieser Vorschlag?"
          content={reasoning}
        />
      )}
    </div>
  );
}