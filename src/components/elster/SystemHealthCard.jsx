import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SystemHealthCard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateHealthReport', {});
      
      if (response.data.success) {
        setHealth(response.data.health);
        toast.success('Systemprüfung abgeschlossen');
      }
    } catch (error) {
      toast.error('Prüfung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System-Gesundheit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!health ? (
          <Button onClick={checkHealth} disabled={loading} className="w-full">
            {loading ? 'Prüfe...' : 'Systemcheck starten'}
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              {getStatusIcon(health.status)}
              <div className="text-right">
                <div className="text-2xl font-bold">{health.overall_score}</div>
                <div className="text-xs text-slate-600">Gesundheits-Score</div>
              </div>
            </div>

            {health.issues.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Kritische Probleme</div>
                {health.issues.map((issue, idx) => (
                  <div key={idx} className="text-xs flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-red-600 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}

            {health.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-yellow-600">Warnungen</div>
                {health.warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={checkHealth} variant="outline" size="sm" className="w-full">
              Erneut prüfen
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}