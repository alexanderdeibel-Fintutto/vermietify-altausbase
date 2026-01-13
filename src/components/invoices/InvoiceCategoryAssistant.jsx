import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function InvoiceCategoryAssistant({ description, onSelect, disabled }) {
  const { data: suggestions = [] } = useQuery({
    queryKey: ['category-suggestions', description],
    queryFn: async () => {
      if (!description || description.length < 3) return [];
      const result = await base44.functions.invoke('suggestInvoiceCategory', {
        description: description,
        limit: 3
      });
      return result.data?.suggestions || [];
    },
    enabled: !!description && !disabled
  });

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <Sparkles className="w-3 h-3 text-amber-500" />
        Kategorievorschläge
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((sugg, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onSelect(sugg.id)}
            className="text-xs"
          >
            {sugg.main_category} {sugg.confidence && `(${Math.round(sugg.confidence)}%)`}
          </Button>
        ))}
      </div>
    </div>
  );
}