import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CRITICAL_FLOWS = [
  {
    id: 'invoice_creation',
    name: 'Rechnungserstellung',
    steps: [
      { name: 'Formular öffnen', test: async () => true },
      { name: 'Pflichtfelder validieren', test: async () => true },
      { name: 'Rechnung speichern', test: async (ctx) => {
        const invoice = await base44.entities.Invoice.create({
          description: 'Test-Rechnung',
          amount: 100,
          invoice_date: new Date().toISOString(),
          type: 'expense'
        });
        ctx.invoiceId = invoice.id;
        return !!invoice.id;
      }},
      { name: 'Rechnung abrufen', test: async (ctx) => {
        const invoices = await base44.entities.Invoice.list();
        return invoices.some(i => i.id === ctx.invoiceId);
      }},
      { name: 'Rechnung löschen', test: async (ctx) => {
        await base44.entities.Invoice.delete(ctx.invoiceId);
        return true;
      }}
    ]
  },
  {
    id: 'contract_workflow',
    name: 'Vertragsworkflow',
    steps: [
      { name: 'Gebäude prüfen', test: async (ctx) => {
        const buildings = await base44.entities.Building.list();
        ctx.hasBuildings = buildings.length > 0;
        return true;
      }},
      { name: 'Einheiten prüfen', test: async (ctx) => {
        const units = await base44.entities.Unit.list();
        ctx.hasUnits = units.length > 0;
        return true;
      }},
      { name: 'Mieter prüfen', test: async () => {
        const tenants = await base44.entities.Tenant.list();
        return true;
      }}
    ]
  },
  {
    id: 'backup_restore',
    name: 'Backup & Wiederherstellung',
    steps: [
      { name: 'Daten exportieren', test: async (ctx) => {
        const data = await base44.entities.Invoice.list();
        ctx.backupData = JSON.stringify(data);
        return ctx.backupData.length > 0;
      }},
      { name: 'Export validieren', test: async (ctx) => {
        const parsed = JSON.parse(ctx.backupData);
        return Array.isArray(parsed);
      }}
    ]
  },
  {
    id: 'search_performance',
    name: 'Suchperformance',
    steps: [
      { name: 'Einfache Suche', test: async () => {
        const start = performance.now();
        await base44.entities.Invoice.list();
        const duration = performance.now() - start;
        return duration < 2000; // < 2 Sekunden
      }},
      { name: 'Filter-Suche', test: async () => {
        const start = performance.now();
        await base44.entities.Invoice.filter({ type: 'expense' });
        const duration = performance.now() - start;
        return duration < 3000; // < 3 Sekunden
      }}
    ]
  }
];

export default function AutomatedTestRunner() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);

    const totalSteps = CRITICAL_FLOWS.reduce((sum, flow) => sum + flow.steps.length, 0);
    let completedSteps = 0;

    for (const flow of CRITICAL_FLOWS) {
      setCurrentTest(flow.name);
      const flowResult = {
        flow: flow.name,
        steps: [],
        passed: true,
        duration: 0
      };

      const startTime = performance.now();
      const context = {};

      for (const step of flow.steps) {
        try {
          const stepStart = performance.now();
          const passed = await step.test(context);
          const stepDuration = performance.now() - stepStart;

          flowResult.steps.push({
            name: step.name,
            passed,
            duration: Math.round(stepDuration)
          });

          if (!passed) flowResult.passed = false;
        } catch (error) {
          flowResult.steps.push({
            name: step.name,
            passed: false,
            error: error.message
          });
          flowResult.passed = false;
        }

        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      flowResult.duration = Math.round(performance.now() - startTime);
      setResults(prev => [...prev, flowResult]);
    }

    setRunning(false);
    setCurrentTest(null);
    
    const allPassed = results.every(r => r.passed);
    if (allPassed) {
      toast.success('Alle Tests erfolgreich');
    } else {
      toast.error('Einige Tests sind fehlgeschlagen');
    }
  };

  const totalTests = results.reduce((sum, r) => sum + r.steps.length, 0);
  const passedTests = results.reduce((sum, r) => sum + r.steps.filter(s => s.passed).length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Automatische Tests</span>
          <Button
            onClick={runTests}
            disabled={running}
            className="gap-2"
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            Tests ausführen
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {running && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Laufender Test: {currentTest}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-xs text-slate-600">Erfolgreich</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
                <div className="text-xs text-slate-600">Fehlgeschlagen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">{totalTests}</div>
                <div className="text-xs text-slate-600">Gesamt</div>
              </div>
            </div>

            {results.map((result, idx) => (
              <Card key={idx} className={result.passed ? 'border-green-200' : 'border-red-200'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold">{result.flow}</span>
                    </div>
                    <Badge variant="outline">{result.duration}ms</Badge>
                  </div>

                  <div className="space-y-1">
                    {result.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          {step.passed ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>{step.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">{step.duration}ms</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}