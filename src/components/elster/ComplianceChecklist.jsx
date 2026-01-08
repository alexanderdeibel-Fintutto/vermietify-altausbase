import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function ComplianceChecklist({ submission }) {
  const [checklist, setChecklist] = useState({
    certificates_valid: false,
    all_required_fields: false,
    plausibility_ok: false,
    audit_trail_complete: false,
    backup_created: false,
    xml_validated: false,
    legal_form_correct: false,
    accounting_consistent: false
  });

  const checks = [
    {
      key: 'certificates_valid',
      label: 'Zertifikate gültig',
      description: 'ELSTER-Zertifikate sind aktiv und nicht abgelaufen'
    },
    {
      key: 'all_required_fields',
      label: 'Pflichtfelder vollständig',
      description: 'Alle erforderlichen Felder sind ausgefüllt'
    },
    {
      key: 'plausibility_ok',
      label: 'Plausibilitätsprüfung OK',
      description: 'Daten entsprechen Branchennormen'
    },
    {
      key: 'audit_trail_complete',
      label: 'Audit-Trail vollständig',
      description: 'Alle Änderungen dokumentiert'
    },
    {
      key: 'backup_created',
      label: 'Backup erstellt',
      description: 'Datensicherung vor Übermittlung'
    },
    {
      key: 'xml_validated',
      label: 'XML validiert',
      description: 'XML gegen ELSTER-Schema geprüft'
    },
    {
      key: 'legal_form_correct',
      label: 'Rechtsform korrekt',
      description: `Rechtsform ist ${submission?.legal_form}`
    },
    {
      key: 'accounting_consistent',
      label: 'Buchhaltung konsistent',
      description: 'Einnahmen-Ausgaben-Abweichungen <5%'
    }
  ];

  const completed = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;
  const progress = (completed / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>GoBD-Compliance-Checkliste</span>
          <Badge variant="secondary">{Math.round(progress)}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Checkliste */}
        <div className="space-y-2">
          {checks.map(check => (
            <div key={check.key} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
              <Checkbox
                checked={checklist[check.key]}
                onCheckedChange={(checked) => 
                  setChecklist({ ...checklist, [check.key]: checked })
                }
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{check.label}</div>
                <div className="text-xs text-slate-600">{check.description}</div>
              </div>
              {checklist[check.key] && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          {completed === total ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>✓ Alle Compliance-Kriterien erfüllt</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Noch {total - completed} Punkt(e) zu prüfen</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}