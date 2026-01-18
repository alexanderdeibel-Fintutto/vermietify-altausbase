import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function BKChecker() {
  const [checks, setChecks] = useState({
    frist_12_monate: null,
    formale_anforderungen: null,
    verteilerschluessel: null,
    belegpflicht: null
  });

  const checkResults = [
    {
      id: 'frist_12_monate',
      title: '12-Monats-Frist eingehalten?',
      description: 'Abrechnung muss innerhalb 12 Monaten nach Ende des Abrechnungszeitraums zugestellt werden (§ 556 Abs. 3 BGB)',
      status: checks.frist_12_monate
    },
    {
      id: 'formale_anforderungen',
      title: 'Formale Anforderungen erfüllt?',
      description: 'Abrechnungszeitraum, Gesamtkosten, Verteilerschlüssel, Ihre Kostenanteile müssen angegeben sein',
      status: checks.formale_anforderungen
    },
    {
      id: 'verteilerschluessel',
      title: 'Verteilerschlüssel korrekt?',
      description: 'Nach § 556a BGB bzw. § 2 BetrKV: nach Wohnfläche, Personen oder vereinbart',
      status: checks.verteilerschluessel
    },
    {
      id: 'belegpflicht',
      title: 'Belege beigefügt?',
      description: 'Mieter haben Anspruch auf Belegeinsicht (§ 259 BGB)',
      status: checks.belegpflicht
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">BK-Abrechnung Checker</h1>
          <p className="vf-tool-description">
            Prüfen Sie, ob Ihre Betriebskostenabrechnung rechtssicher ist
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checkliste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkResults.map((check) => (
                <div key={check.id} className="border border-[var(--vf-neutral-200)] rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {check.status === true && <CheckCircle className="h-6 w-6 text-[var(--vf-success-500)] flex-shrink-0 mt-1" />}
                    {check.status === false && <XCircle className="h-6 w-6 text-[var(--vf-error-500)] flex-shrink-0 mt-1" />}
                    {check.status === null && <AlertTriangle className="h-6 w-6 text-[var(--vf-neutral-400)] flex-shrink-0 mt-1" />}
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{check.title}</div>
                      <p className="text-sm text-[var(--vf-neutral-600)]">{check.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={check.status === true ? 'primary' : 'outline'}
                      onClick={() => setChecks({ ...checks, [check.id]: true })}
                    >
                      ✓ Ja
                    </Button>
                    <Button 
                      size="sm" 
                      variant={check.status === false ? 'destructive' : 'outline'}
                      onClick={() => setChecks({ ...checks, [check.id]: false })}
                    >
                      ✗ Nein
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[var(--theme-surface)] rounded-lg">
              <div className="font-semibold mb-2">Ergebnis:</div>
              {Object.values(checks).every(v => v === true) ? (
                <div className="text-[var(--vf-success-700)]">
                  ✓ Ihre Abrechnung erfüllt alle formalen Anforderungen
                </div>
              ) : Object.values(checks).some(v => v === false) ? (
                <div className="text-[var(--vf-error-700)]">
                  ✗ Es gibt Punkte, die Sie überprüfen sollten
                </div>
              ) : (
                <div className="text-[var(--vf-neutral-600)]">
                  Beantworten Sie alle Fragen für eine Auswertung
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}