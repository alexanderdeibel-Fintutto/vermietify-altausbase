import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default function AICostDisplay({ usage }) {
  if (!usage || !usage.cost_eur) return null;

  const hasSavings = usage.savings_eur > 0;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
      <Badge variant="outline" className="text-xs">
        €{usage.cost_eur.toFixed(4)}
      </Badge>
      {hasSavings && (
        <span className="flex items-center gap-1 text-green-600">
          <Sparkles className="w-3 h-3" />
          €{usage.savings_eur.toFixed(4)} gespart ({usage.savings_percent}%)
        </span>
      )}
      <span className="text-muted-foreground">
        {usage.input_tokens + usage.output_tokens} tokens · {usage.response_time_ms}ms
      </span>
    </div>
  );
}