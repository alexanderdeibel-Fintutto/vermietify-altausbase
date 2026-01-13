import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight } from 'lucide-react';

export default function ContextualRecommendations({ 
  recommendations = [],
  onApply,
  loading = false
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      {recommendations.map((rec, idx) => (
        <Card key={idx} className="p-3 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{rec.title}</p>
              {rec.description && (
                <p className="text-xs text-blue-800 mt-1">{rec.description}</p>
              )}
              {rec.action && (
                <Button
                  onClick={() => onApply?.(rec.action)}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs gap-1 bg-blue-100 hover:bg-blue-200 border-blue-300"
                >
                  {rec.actionLabel || 'Anwenden'}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}