import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AnomalyAlert({ submissionId }) {
  const [checking, setChecking] = useState(false);
  const [anomalies, setAnomalies] = useState(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const response = await base44.functions.invoke('detectAnomalies', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setAnomalies(response.data.anomalies);
        if (response.data.anomalies.length === 0) {
          toast.success('Keine Anomalien gefunden');
        }
      }
    } catch (error) {
      toast.error('Anomalie-Check fehlgeschlagen');
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  if (!anomalies) {
    return (
      <Button
        onClick={handleCheck}
        disabled={checking}
        variant="outline"
        size="sm"
      >
        {checking ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <AlertTriangle className="w-4 h-4 mr-2" />
        )}
        Anomalien prüfen
      </Button>
    );
  }

  if (anomalies.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        Keine Anomalien gefunden
      </div>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {anomalies.length} Anomalie{anomalies.length !== 1 ? 'n' : ''} erkannt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((anomaly, idx) => (
          <div key={idx} className="p-3 bg-white rounded border border-yellow-200">
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-sm">{anomaly.field}</span>
              <Badge variant={anomaly.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                {anomaly.severity}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{anomaly.message}</p>
            {anomaly.historical_avg && (
              <div className="text-xs text-slate-500 mt-2">
                Historischer Durchschnitt: {anomaly.historical_avg}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}