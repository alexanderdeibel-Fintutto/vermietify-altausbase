import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ComplianceMonitor() {
  const checks = [
    { name: 'Aufbewahrungsfristen eingehalten', passed: true, critical: true },
    { name: 'Alle Belege vorhanden', passed: true, critical: true },
    { name: 'GoBD-Archivierung aktiv', passed: true, critical: true },
    { name: 'Doppelte Buchungen geprüft', passed: false, critical: false },
    { name: 'Plausibilitätsprüfung', passed: true, critical: false },
    { name: 'Kategorisierung vollständig', passed: false, critical: false }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const complianceScore = (passedCount / checks.length) * 100;
  const criticalIssues = checks.filter(c => c.critical && !c.passed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance-Monitor
          </CardTitle>
          {criticalIssues > 0 && (
            <Badge className="bg-red-600">{criticalIssues} kritisch</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
          <p className="text-sm text-slate-700 mb-1">Compliance-Score</p>
          <p className="text-4xl font-bold text-blue-900">{complianceScore.toFixed(0)}%</p>
        </div>

        <div className="space-y-2">
          {checks.map(check => (
            <div key={check.name} className={`p-2 rounded flex items-center gap-2 ${
              !check.passed && check.critical ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
            }`}>
              {check.passed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className={`w-4 h-4 ${check.critical ? 'text-red-600' : 'text-orange-600'}`} />
              )}
              <span className="text-sm flex-1">{check.name}</span>
              {check.critical && !check.passed && (
                <Badge className="bg-red-600 text-xs">Kritisch</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}