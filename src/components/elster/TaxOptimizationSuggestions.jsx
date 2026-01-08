import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxOptimizationSuggestions({ submission }) {
  const [optimizations, setOptimizations] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestTaxOptimizations', {
        building_id: submission.building_id,
        tax_year: submission.tax_year
      });

      setOptimizations(response.data.suggestions);
      toast.success('Optimierungsanalyse abgeschlossen');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const getEffortColor = (effort) => {
    switch (effort?.toLowerCase()) {
      case 'gering': return 'bg-green-100 text-green-800';
      case 'mittel': return 'bg-yellow-100 text-yellow-800';
      case 'hoch': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'gering': return 'text-green-600';
      case 'mittel': return 'text-yellow-600';
      case 'hoch': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Steuer-Optimierungen
          </span>
          <Button 
            size="sm" 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analysiere...
              </>
            ) : (
              'Analysieren'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!optimizations ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Klicke "Analysieren" um Optimierungsmöglichkeiten zu finden
          </p>
        ) : optimizations.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine zusätzlichen Optimierungen gefunden
          </p>
        ) : (
          <div className="space-y-3">
            {optimizations.map((opt, idx) => (
              <div key={idx} className="p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-sm">{opt.title}</div>
                  <Badge className={getEffortColor(opt.effort)}>
                    Aufwand: {opt.effort}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{opt.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      Ersparnisse: {opt.estimated_savings_percent}%
                    </Badge>
                  </div>
                  <span className={`font-medium ${getRiskColor(opt.compliance_risk)}`}>
                    Risiko: {opt.compliance_risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}