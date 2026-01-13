import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EmptyStateWithAction({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  tips = []
}) {
  return (
    <Card className="border-dashed">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {Icon && <Icon className="w-16 h-16 text-slate-300 mb-4" />}
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 max-w-sm">{description}</p>
        
        {onAction && (
          <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700 mb-6">
            {actionLabel}
          </Button>
        )}

        {tips.length > 0 && (
          <div className="mt-6 w-full border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">💡 Tipps:</p>
            <ul className="space-y-1 text-xs text-slate-600 text-left">
              {tips.map((tip, idx) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}