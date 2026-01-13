import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function CategorySuggestions({ recipient, costTypes, onSelect }) {
  if (!recipient || !costTypes.length) return null;

  // Häufigste Kategorien für diesen Empfänger
  const suggestions = React.useMemo(() => {
    const suggestions = costTypes
      .filter(ct => ct.type === 'expense')
      .slice(0, 3)
      .map(ct => ({
        id: ct.id,
        category: ct.main_category,
        sub: ct.sub_category,
        distributable: ct.distributable
      }));
    return suggestions;
  }, [costTypes]);

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <p className="text-xs font-medium text-amber-900">Häufige Kategorien für {recipient}:</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(sugg => (
          <Button
            key={sugg.id}
            size="sm"
            variant="outline"
            onClick={() => onSelect(sugg.id)}
            className="text-xs gap-1"
          >
            {sugg.sub}
            {sugg.distributable && <span className="text-amber-600">📦</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}