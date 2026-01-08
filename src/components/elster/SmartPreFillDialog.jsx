import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp, CheckCircle, Info, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SmartPreFillDialog({ buildingId, formType, taxYear, open, onOpenChange, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (open && buildingId && formType && taxYear) {
      loadSuggestions();
    }
  }, [open, buildingId, formType, taxYear]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('smartPreFillForm', {
        building_id: buildingId,
        form_type: formType,
        tax_year: taxYear
      });

      if (response.data.success) {
        setResult(response.data);
      }
    } catch (error) {
      toast.error('Vorausfüllen fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && result.prefill_data) {
      onApply(result.prefill_data);
      onOpenChange(false);
      toast.success(`${Object.keys(result.prefill_data).length} Felder vorausgefüllt`);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 90) return <Badge className="bg-green-600">Sehr sicher</Badge>;
    if (confidence >= 70) return <Badge className="bg-blue-600">Wahrscheinlich</Badge>;
    return <Badge variant="outline">Geschätzt</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Intelligentes Vorausfüllen
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {result.suggestions.length} Felder können vorausgefüllt werden mit durchschnittlich{' '}
                <strong>{result.average_confidence}%</strong> Sicherheit
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 bg-slate-50 rounded text-center">
                <div className="font-medium text-slate-900">
                  {result.data_sources.historical_submissions}
                </div>
                <div className="text-xs text-slate-600">Vorjahre</div>
              </div>
              <div className="p-2 bg-slate-50 rounded text-center">
                <div className="font-medium text-slate-900">
                  {result.data_sources.financial_items}
                </div>
                <div className="text-xs text-slate-600">Buchungen</div>
              </div>
              <div className="p-2 bg-slate-50 rounded text-center">
                <div className="font-medium text-slate-900">
                  {result.data_sources.building_data ? '✓' : '–'}
                </div>
                <div className="text-xs text-slate-600">Stammdaten</div>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 border rounded-lg ${
                      suggestion.override ? 'border-green-200 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{suggestion.field}</div>
                        <div className="text-lg font-bold text-slate-900">
                          {typeof suggestion.value === 'number' 
                            ? suggestion.value.toLocaleString('de-DE', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })
                            : suggestion.value
                          }
                        </div>
                      </div>
                      {getConfidenceBadge(suggestion.confidence)}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {suggestion.reason}
                    </div>

                    {suggestion.historical_values && suggestion.historical_values.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        Historie: {suggestion.historical_values.map(v => 
                          v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                        ).join(' → ')}
                      </div>
                    )}

                    {suggestion.override && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Basiert auf tatsächlichen Buchungen
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Felder übernehmen
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Keine Daten verfügbar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}