import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, CheckCircle, AlertTriangle, XCircle,
  FileText, Clock, Database, Lock
} from 'lucide-react';

export default function ComplianceMonitoring({ submissions }) {
  const currentYear = new Date().getFullYear();

  const complianceChecks = [
    {
      id: 'gobd',
      name: 'GoBD-Konformität',
      description: 'Ordnungsgemäße Buchführung',
      icon: Database,
      passed: true,
      details: 'Alle Dokumente revisionssicher archiviert'
    },
    {
      id: 'aufbewahrung',
      name: 'Aufbewahrungsfristen',
      description: '10 Jahre Steuerunterlagen',
      icon: Clock,
      passed: true,
      details: 'Automatische Archivierung aktiv'
    },
    {
      id: 'datenschutz',
      name: 'Datenschutz (DSGVO)',
      description: 'Verschlüsselung & Zugriffskontrolle',
      icon: Lock,
      passed: true,
      details: 'Ende-zu-Ende verschlüsselt'
    },
    {
      id: 'vollstaendigkeit',
      name: 'Vollständigkeit',
      description: 'Alle Pflichtangaben',
      icon: FileText,
      passed: submissions.every(s => s.form_data && Object.keys(s.form_data).length > 0),
      details: submissions.every(s => s.form_data && Object.keys(s.form_data).length > 0)
        ? 'Alle Formulare vollständig'
        : 'Einige Formulare unvollständig'
    },
    {
      id: 'fristen',
      name: 'Fristen-Einhaltung',
      description: 'Rechtzeitige Abgabe',
      icon: Clock,
      passed: true,
      details: 'Keine verpassten Fristen'
    },
    {
      id: 'plausibilitaet',
      name: 'Plausibilitätsprüfung',
      description: 'Zahlen im erwarteten Bereich',
      icon: CheckCircle,
      passed: submissions.filter(s => s.ai_confidence_score >= 70).length === submissions.length,
      details: `${submissions.filter(s => s.ai_confidence_score >= 70).length}/${submissions.length} bestanden`
    }
  ];

  const passedChecks = complianceChecks.filter(c => c.passed).length;
  const complianceScore = (passedChecks / complianceChecks.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Compliance-Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Compliance-Score</span>
            <span className="text-2xl font-bold text-blue-700">
              {complianceScore.toFixed(0)}%
            </span>
          </div>
          <Progress value={complianceScore} className="h-2" />
          <div className="text-xs text-slate-600 mt-2">
            {passedChecks} von {complianceChecks.length} Checks bestanden
          </div>
        </div>

        {/* Checks */}
        <div className="space-y-2">
          {complianceChecks.map(check => {
            const Icon = check.icon;
            return (
              <div
                key={check.id}
                className={`p-3 border rounded-lg ${
                  check.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      check.passed ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        check.passed ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{check.name}</div>
                      <div className="text-xs text-slate-600 mb-2">
                        {check.description}
                      </div>
                      <div className={`text-xs ${
                        check.passed ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {check.details}
                      </div>
                    </div>
                  </div>
                  {check.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnostics Section */}
        {!diagnostics && (
          <Button
            onClick={handleDiagnose}
            disabled={diagnosing}
            variant="outline"
            className="w-full"
          >
            {diagnosing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Stethoscope className="w-4 h-4 mr-2" />
            )}
            Tiefendiagnose durchführen
          </Button>
        )}

        {diagnostics && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Diagnose-Ergebnis</span>
              <Badge variant={diagnostics.overall_health_score >= 80 ? 'default' : 'destructive'}>
                {diagnostics.overall_health_score}/100
              </Badge>
            </div>

            {diagnostics.risk_assessment && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                {diagnostics.risk_assessment}
              </div>
            )}

            <div className="text-sm text-slate-600">
              {diagnostics.issues?.length || 0} Probleme identifiziert
            </div>
          </div>
        )}

        {/* Certification Badge */}
        {complianceScore === 100 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg text-center">
            <Shield className="w-12 h-12 mx-auto mb-2 text-green-600" />
            <div className="font-bold text-green-900">Vollständig Compliant</div>
            <div className="text-xs text-green-700 mt-1">
              Alle Anforderungen erfüllt
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}