import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LifecycleHints() {
  const [dismissed, setDismissed] = useState([]);
  const navigate = useNavigate();

  const { data: hint } = useQuery({
    queryKey: ['lifecycleHints'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getLifecycleHints', {});
      return res.data.hint;
    }
  });

  if (!hint || dismissed.includes(hint.id)) return null;

  const handleDismiss = () => {
    setDismissed([...dismissed, hint.id]);
  };

  const handleAction = () => {
    if (hint.actionPage) {
      navigate(createPageUrl(hint.actionPage));
    }
    handleDismiss();
  };

  return (
    <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
      <CardContent className="pt-4 flex items-start gap-3">
        <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 mb-1">📅 {hint.title}</h4>
          <p className="text-sm text-slate-600 mb-3">{hint.description}</p>
          <div className="flex items-center gap-2">
            {hint.actionPage && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAction}>
                {hint.actionLabel || 'Jetzt starten'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Später
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}