import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, AlertTriangle, Shield } from 'lucide-react';

export default function ComplianceChecklist({ submission }) {
  const checks = [
    {
      id: 'certificate',
      title: 'Gültiges ELSTER-Zertifikat',
      required: true,
      status: submission.certificate_used ? 'pass' : 'fail',
      description: 'Zertifikat für Übermittlung vorhanden'
    },
    {
      id: 'tax_number',
      title: 'Steuernummer verifiziert',
      required: true,
      status: submission.form_data?.tax_number ? 'pass' : 'fail',
      description: 'Gültige Steuernummer angegeben'
    },
    {
      id: 'validation',
      title: 'Formular validiert',
      required: true,
      status: submission.status === 'VALIDATED' || submission.status === 'SUBMITTED' || submission.status === 'ACCEPTED' ? 'pass' : 'pending',
      description: 'XSD-Validierung erfolgreich'
    },
    {
      id: 'plausibility',
      title: 'Plausibilitätsprüfung',
      required: false,
      status: submission.ai_confidence_score >= 70 ? 'pass' : 'warning',
      description: 'KI-Vertrauen >= 70%'
    },
    {
      id: 'backup',
      title: 'GoBD-konforme Archivierung',
      required: true,
      status: submission.status === 'ARCHIVED' || submission.status === 'ACCEPTED' ? 'pass' : 'pending',
      description: '10-jährige Aufbewahrung'
    },
    {
      id: 'test_mode',
      title: 'Test-Modus korrekt',
      required: true,
      status: submission.submission_mode === 'TEST' ? 'warning' : 'pass',
      description: submission.submission_mode === 'TEST' ? 'Derzeit im Test-Modus' : 'Produktiv-Modus'
    }
  ];

  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const totalChecks = checks.length;
  const complianceRate = Math.round((passedChecks / totalChecks) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance-Checkliste
          </CardTitle>
          <Badge variant={complianceRate === 100 ? 'default' : 'secondary'}>
            {passedChecks}/{totalChecks}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-slate-50 rounded">
          <div className="text-2xl font-bold text-slate-900">{complianceRate}%</div>
          <div className="text-xs text-slate-600">Compliance-Rate</div>
        </div>

        <div className="space-y-2">
          {checks.map(check => (
            <div key={check.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50">
              <div className="mt-0.5">
                {check.status === 'pass' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{check.title}</span>
                  {check.required && (
                    <Badge variant="outline" className="text-xs">Pflicht</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{check.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}