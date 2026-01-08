import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIErrorCorrectionPanel({ submissionId, onApplyCorrection }) {
  const [corrections, setCorrections] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeErrors = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('aiErrorCorrection', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setCorrections(response.data.corrections);
        toast.success(`${response.data.corrections.length} Korrekturvorschläge gefunden`);
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyCorrection = (correction) => {
    onApplyCorrection(correction.field, correction.suggested_value);
    toast.success('Korrektur angewendet');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Fehlerkorrektur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {corrections.length === 0 ? (
          <Button onClick={analyzeErrors} disabled={analyzing} className="w-full">
            {analyzing ? 'Analysiere...' : 'Fehler analysieren'}
          </Button>
        ) : (
          <div className="space-y-3">
            {corrections.map((corr, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{corr.field}</span>
                  <Button size="sm" onClick={() => applyCorrection(corr)}>
                    <Check className="w-3 h-3 mr-1" />
                    Anwenden
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-600">Aktuell:</div>
                    <Badge variant="outline">{corr.current_value}</Badge>
                  </div>
                  <div>
                    <div className="text-slate-600">Vorschlag:</div>
                    <Badge className="bg-green-100 text-green-800">{corr.suggested_value}</Badge>
                  </div>
                </div>
                <div className="text-xs text-slate-600 italic">{corr.reason}</div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={analyzeErrors} className="w-full">
              Neu analysieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}