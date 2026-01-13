import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CategorySuggestions({ recipient, costTypes, onSelect }) {
  if (!recipient || !costTypes.length) return null;

  // Get all invoices to find history for this recipient
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-for-suggestions', recipient],
    queryFn: () => base44.entities.Invoice.list(),
    staleTime: 5 * 60 * 1000
  });

  // Smart suggestions based on invoice history
  const suggestions = React.useMemo(() => {
    // Count cost type usage for this recipient
    const usageCount = {};
    invoices
      .filter(inv => inv.recipient === recipient && inv.cost_type_id)
      .forEach(inv => {
        usageCount[inv.cost_type_id] = (usageCount[inv.cost_type_id] || 0) + 1;
      });

    // Sort by frequency and get top 3
    const topCostTypes = costTypes
      .filter(ct => ct.type === 'expense')
      .sort((a, b) => (usageCount[b.id] || 0) - (usageCount[a.id] || 0))
      .slice(0, 3)
      .map(ct => ({
        id: ct.id,
        category: ct.main_category,
        sub: ct.sub_category,
        distributable: ct.distributable,
        frequency: usageCount[ct.id] || 0
      }));
    
    return topCostTypes;
  }, [costTypes, invoices, recipient]);

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <p className="text-xs font-medium text-blue-900">
          {suggestions.some(s => s.frequency > 0) ? '✨ Häufig' : 'Kategorien'} für {recipient}:
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(sugg => (
          <Button
            key={sugg.id}
            size="sm"
            variant="outline"
            onClick={() => onSelect(sugg.id)}
            className="text-xs gap-1"
            title={sugg.frequency > 0 ? `${sugg.frequency}x verwendet` : 'Neue Kategorie'}
          >
            {sugg.sub}
            {sugg.distributable && <span className="text-blue-600">📦</span>}
            {sugg.frequency > 0 && <span className="text-blue-600 text-[10px]">×{sugg.frequency}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}