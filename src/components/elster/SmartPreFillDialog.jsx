import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartPreFillDialog({ submission, open, onOpenChange, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handlePreFill = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('smartPreFillForm', {
        submission_id: submission.id
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        toast.success('Formular intelligent vorausgefüllt');
        onSuccess?.(response.data.updated_submission);
      }
    } catch (error) {
      toast.error('Pre-Fill fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const getSuggestionCount = () => {
    if (!suggestions) return 0;
    return Object.keys(suggestions.from_financial_data).length + 
           Object.keys(suggestions.from_historical_avg).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Intelligentes Vorausfüllen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!suggestions ? (
            <>
              <div className="text-sm text-slate-600">
                Das System analysiert:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Finanzdaten für {submission.tax_year}</li>
                  <li>Historische Submissions</li>
                  <li>Durchschnittswerte & Trends</li>
                </ul>
              </div>

              <Button 
                onClick={handlePreFill}
                disabled={processing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Jetzt vorausfüllen
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-700">Vorschläge generiert</span>
                  <Badge className="bg-green-600">{getSuggestionCount()}</Badge>
                </div>
              </div>

              {Object.keys(suggestions.from_financial_data).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    Aus Finanzdaten:
                  </div>
                  <div className="space-y-2">
                    {Object.entries(suggestions.from_financial_data).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {suggestions.confidence_scores[key]}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(suggestions.from_historical_avg).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Historischer Durchschnitt:
                  </div>
                  <div className="space-y-2">
                    {Object.entries(suggestions.from_historical_avg).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {suggestions.confidence_scores[key]}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Fertig
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}