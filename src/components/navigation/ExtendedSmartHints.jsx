import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ExtendedSmartHints() {
  const [dismissedHints, setDismissedHints] = useState([]);
  const navigate = useNavigate();

  const { data: hints = [] } = useQuery({
    queryKey: ['extendedSmartHints'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getExtendedSmartHints', {});
      return res.data.hints || [];
    }
  });

  const visibleHints = hints.filter(h => !dismissedHints.includes(h.id)).slice(0, 2);

  if (visibleHints.length === 0) return null;

  const handleDismiss = (hintId) => {
    setDismissedHints([...dismissedHints, hintId]);
  };

  const handleAction = (hint) => {
    if (hint.actionPage) {
      navigate(createPageUrl(hint.actionPage));
    }
    handleDismiss(hint.id);
  };

  return (
    <div className="space-y-3">
      {visibleHints.map(hint => (
        <Card key={hint.id} className="border border-amber-200 bg-amber-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">{hint.title}</h4>
              <p className="text-sm text-slate-600 mb-2">{hint.description}</p>
              {hint.actionPage && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  onClick={() => handleAction(hint)}
                >
                  {hint.actionLabel || 'Los geht\'s'}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
            <button onClick={() => handleDismiss(hint.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}