import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function IntelligentCleaningTool({ submissionId, onCleanComplete }) {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);

  const cleanData = async () => {
    setCleaning(true);
    try {
      const response = await base44.functions.invoke('intelligentDataCleaning', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success(`${response.data.changes_applied} Änderungen angewendet`);
        onCleanComplete?.();
      }
    } catch (error) {
      toast.error('Bereinigung fehlgeschlagen');
      console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Intelligente Datenbereinigung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          KI-gestützte Bereinigung von Formulardaten: Entfernt leere Felder, normalisiert Zahlen und validiert Konsistenz.
        </p>

        <Button onClick={cleanData} disabled={cleaning} className="w-full">
          {cleaning ? 'Bereinige...' : 'Daten bereinigen'}
        </Button>

        {result && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">
                {result.changes_applied} Änderungen angewendet
              </span>
            </div>

            {result.changes && result.changes.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-600">Details:</div>
                {result.changes.map((change, idx) => (
                  <div key={idx} className="text-xs p-2 bg-slate-50 rounded">
                    {change}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}