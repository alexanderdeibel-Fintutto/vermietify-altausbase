import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DataQualityMonitor() {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkQuality = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('monitorDataQuality', {});

      if (response.data.success) {
        setQuality(response.data.quality);
        toast.success('Qualitätsprüfung abgeschlossen');
      }
    } catch (error) {
      toast.error('Qualitätsprüfung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!quality) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datenqualitäts-Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={checkQuality} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Qualität prüfen
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scoreColor = quality.average_score >= 80 ? 'text-green-600' : 
                     quality.average_score >= 60 ? 'text-yellow-600' : 
                     'text-red-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Datenqualität</CardTitle>
          <Button variant="outline" size="sm" onClick={checkQuality} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {quality.average_score}
          </div>
          <div className="text-sm text-slate-600 mt-1">Durchschnittlicher Qualitäts-Score</div>
          <Progress value={quality.average_score} className="mt-4" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold">{quality.total_submissions}</div>
            <div className="text-xs text-slate-600">Submissions</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {quality.problematic_submissions.length}
            </div>
            <div className="text-xs text-slate-600">Probleme</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Gefundene Probleme:</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span>Fehlende Felder</span>
              <Badge variant="outline">{quality.issues.missing_fields}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Niedrige Confidence</span>
              <Badge variant="outline">{quality.issues.low_confidence}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Validierungsfehler</span>
              <Badge variant="outline">{quality.issues.validation_errors}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Fehlende Doku</span>
              <Badge variant="outline">{quality.issues.missing_documentation}</Badge>
            </div>
          </div>
        </div>

        {quality.problematic_submissions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Kritische Submissions:</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {quality.problematic_submissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="p-2 bg-yellow-50 rounded text-xs">
                  <div className="font-medium">{sub.form_type} - {sub.year}</div>
                  <div className="text-slate-600">Score: {sub.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}