import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DataQualityMonitor() {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeDataQuality', {});
      
      if (response.data.success) {
        setAnalysis(response.data.analysis);
        toast.success('Datenqualität analysiert');
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datenqualitäts-Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <Button onClick={runAnalysis} disabled={analyzing} className="w-full">
            {analyzing ? 'Analysiere...' : 'Qualität prüfen'}
          </Button>
        ) : (
          <>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">Gesamt-Score</div>
              <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}%
              </div>
            </div>

            <div className="space-y-3">
              {['completeness', 'consistency', 'accuracy', 'timeliness'].map(metric => (
                <div key={metric}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm capitalize">{metric}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${getScoreColor(analysis[metric].score)}`}>
                        {analysis[metric].score}%
                      </span>
                      {analysis[metric].issues.length > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <Progress value={analysis[metric].score} />
                  {analysis[metric].issues.length > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {analysis[metric].issues.length} Problem(e) gefunden
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={runAnalysis} className="w-full">
              Neu analysieren
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}