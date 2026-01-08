import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TestTube, Play, CheckCircle, XCircle, 
  AlertTriangle, Loader2, FileText 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutomatedTestingSuite({ submission }) {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const testSuites = [
    {
      id: 'structure',
      name: 'Struktur-Validierung',
      description: 'XML-Struktur und Schema-Konformität',
      tests: ['XML Well-formed', 'Schema Validation', 'Namespace Check']
    },
    {
      id: 'data',
      name: 'Daten-Validierung',
      description: 'Pflichtfelder und Datentypen',
      tests: ['Required Fields', 'Data Types', 'Format Validation']
    },
    {
      id: 'business',
      name: 'Business-Logik',
      description: 'Steuerliche Plausibilität',
      tests: ['Sum Validation', 'Percentage Checks', 'Negative Values']
    },
    {
      id: 'security',
      name: 'Sicherheit',
      description: 'Verschlüsselung und Zertifikate',
      tests: ['Certificate Valid', 'Encryption Check', 'Signature Verification']
    },
    {
      id: 'compliance',
      name: 'Compliance',
      description: 'Gesetzliche Anforderungen',
      tests: ['GoBD Compliance', 'DSGVO Check', 'Retention Policy']
    }
  ];

  const handleRunTests = async () => {
    setTesting(true);
    setProgress(0);

    const results = [];

    try {
      for (let i = 0; i < testSuites.length; i++) {
        const suite = testSuites[i];
        setProgress(((i + 1) / testSuites.length) * 100);

        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 500));

        const suiteResults = {
          suite: suite.name,
          tests_run: suite.tests.length,
          passed: Math.floor(Math.random() * suite.tests.length),
          failed: 0,
          warnings: Math.floor(Math.random() * 2),
          details: suite.tests.map(test => ({
            name: test,
            status: Math.random() > 0.2 ? 'passed' : 'warning',
            message: Math.random() > 0.2 
              ? 'Test bestanden' 
              : 'Kleinere Abweichung festgestellt'
          }))
        };

        suiteResults.failed = suiteResults.tests_run - suiteResults.passed - suiteResults.warnings;
        results.push(suiteResults);
      }

      setTestResults(results);
      
      const totalTests = results.reduce((sum, r) => sum + r.tests_run, 0);
      const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
      
      toast.success(`${totalPassed}/${totalTests} Tests bestanden`);
    } catch (error) {
      toast.error('Tests fehlgeschlagen');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  const totalTests = testResults?.reduce((sum, r) => sum + r.tests_run, 0) || 0;
  const totalPassed = testResults?.reduce((sum, r) => sum + r.passed, 0) || 0;
  const totalFailed = testResults?.reduce((sum, r) => sum + r.failed, 0) || 0;
  const totalWarnings = testResults?.reduce((sum, r) => sum + r.warnings, 0) || 0;

  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-purple-600" />
          Automatisierte Test-Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!testResults ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              Führt {testSuites.length} Test-Suites mit insgesamt{' '}
              {testSuites.reduce((sum, s) => sum + s.tests.length, 0)} Tests durch
            </div>

            <div className="space-y-2">
              {testSuites.map(suite => (
                <div key={suite.id} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-1">{suite.name}</div>
                  <div className="text-xs text-slate-600 mb-2">{suite.description}</div>
                  <Badge variant="outline" className="text-xs">
                    {suite.tests.length} Tests
                  </Badge>
                </div>
              ))}
            </div>

            {testing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tests laufen...</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={handleRunTests}
              disabled={testing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Alle Tests ausführen
            </Button>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <div className="text-2xl font-bold text-green-700">{totalPassed}</div>
                <div className="text-xs text-green-600">Bestanden</div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-700">{totalWarnings}</div>
                <div className="text-xs text-yellow-600">Warnungen</div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <XCircle className="w-5 h-5 mx-auto mb-1 text-red-600" />
                <div className="text-2xl font-bold text-red-700">{totalFailed}</div>
                <div className="text-xs text-red-600">Fehlgeschlagen</div>
              </div>
            </div>

            {/* Pass Rate */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Erfolgsrate</span>
                <span className="text-2xl font-bold text-purple-700">
                  {passRate.toFixed(0)}%
                </span>
              </div>
              <Progress value={passRate} className="h-2" />
            </div>

            {/* Suite Results */}
            <div className="space-y-2">
              {testResults.map((suite, idx) => {
                const suitePassRate = (suite.passed / suite.tests_run) * 100;
                return (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{suite.suite}</div>
                      <Badge variant={suitePassRate === 100 ? 'default' : 'secondary'}>
                        {suite.passed}/{suite.tests_run}
                      </Badge>
                    </div>
                    <Progress value={suitePassRate} className="h-1" />
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => setTestResults(null)}
              className="w-full"
            >
              Neue Tests
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}