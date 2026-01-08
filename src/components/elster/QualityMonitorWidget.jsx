import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function QualityMonitorWidget() {
  const [monitoring, setMonitoring] = useState(false);
  const [result, setResult] = useState(null);

  const runMonitor = async () => {
    setMonitoring(true);
    try {
      const response = await base44.functions.invoke('autoQualityMonitor', {});
      if (response.data.success) {
        setResult(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMonitoring(false);
    }
  };

  useEffect(() => {
    runMonitor();
  }, []);

  if (!result) return null;

  const getColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Qualitäts-Monitor
          </div>
          <Button size="sm" variant="ghost" onClick={runMonitor} disabled={monitoring}>
            <RefreshCw className={`w-4 h-4 ${monitoring ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getColor(result.score)}`}>
            {result.score}
          </div>
          <Progress value={result.score} className="mt-2" />
        </div>

        {result.issues.length > 0 && (
          <div className="space-y-2">
            {result.issues.map((issue, idx) => (
              <div key={idx} className="text-xs p-2 bg-slate-50 rounded">
                <span className="font-medium">{issue.type}</span>
                <span className="text-slate-600"> - {issue.count} ({issue.severity})</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}