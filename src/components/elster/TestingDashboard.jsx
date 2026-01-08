import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TestingDashboard() {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    try {
      const response = await base44.functions.invoke('runRegressionTests', {});
      
      if (response.data.success) {
        setResults(response.data.results);
        toast.success('Tests abgeschlossen');
      }
    } catch (error) {
      toast.error('Tests fehlgeschlagen');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Regression Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <Button onClick={runTests} disabled={running} className="w-full">
            {running ? 'Tests laufen...' : 'Tests starten'}
          </Button>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Total</div>
                <div className="text-lg font-bold">{results.total}</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-xs text-slate-600">Passed</div>
                <div className="text-lg font-bold text-green-600">{results.passed}</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="text-xs text-slate-600">Failed</div>
                <div className="text-lg font-bold text-red-600">{results.failed}</div>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {results.tests.map((test, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs p-2 border rounded">
                  {test.status === 'passed' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="flex-1">{test.name}</span>
                  <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                    {test.status}
                  </Badge>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={runTests} className="w-full">
              Erneut ausführen
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}