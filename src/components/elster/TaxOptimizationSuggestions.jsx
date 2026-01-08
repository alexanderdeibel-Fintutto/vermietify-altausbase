import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, Euro, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxOptimizationSuggestions({ submission }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestTaxOptimizations', {
        submission_id: submission.id
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        toast.success('Optimierungen gefunden');
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Steuer-Optimierung
          </CardTitle>
          <Button onClick={generateSuggestions} disabled={loading} size="sm" variant="outline">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analysieren'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!suggestions ? (
          <div className="text-center py-6 text-slate-600">
            <Lightbulb className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">KI-basierte Optimierungsvorschläge</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.potential_savings && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Potenzielle Ersparnis</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {suggestions.potential_savings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
            )}

            {suggestions.optimizations?.map((opt, idx) => (
              <Alert key={idx} className="bg-blue-50 border-blue-200">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{opt.title}</div>
                      <p className="text-xs mt-1 text-slate-600">{opt.description}</p>
                      <div className="text-xs mt-2 text-blue-700">→ {opt.action}</div>
                    </div>
                    {opt.estimated_savings && (
                      <Badge className="bg-green-100 text-green-800">
                        {opt.estimated_savings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}

            {(!suggestions.optimizations || suggestions.optimizations.length === 0) && (
              <p className="text-sm text-slate-600 text-center py-4">
                Keine Optimierungspotenziale gefunden
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}