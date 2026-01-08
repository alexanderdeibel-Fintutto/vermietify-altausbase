import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function ComplianceAuditPage() {
  const audits = [
    { id: 1, area: 'Datenschutz (GDPR)', status: 'compliant', score: 98, lastAudit: '2026-01-05' },
    { id: 2, area: 'Mietrecht', status: 'compliant', score: 95, lastAudit: '2025-12-20' },
    { id: 3, area: 'Steuervorschriften', status: 'warning', score: 78, lastAudit: '2025-11-15' },
    { id: 4, area: 'Arbeitssicherheit', status: 'compliant', score: 92, lastAudit: '2025-10-30' },
  ];

  const stats = [
    { label: 'Gesamt Score', value: '91%' },
    { label: 'Compliant', value: '3/4' },
    { label: 'Warnings', value: '1' },
    { label: 'Nächster Audit', value: '15.02.2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">✅ Compliance Audit</h1>
          <p className="text-slate-600 mt-1">Überwachung der Compliance-Anforderungen</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700"><FileText className="w-4 h-4 mr-2" />Report generieren</Button>
      </div>

      <QuickStats stats={stats} accentColor="green" />

      <div className="space-y-3">
        {audits.map((audit) => (
          <Card key={audit.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {audit.status === 'compliant' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    )}
                    <h3 className="font-semibold text-slate-900">{audit.area}</h3>
                    <Badge className={audit.status === 'compliant' ? 'bg-green-600' : 'bg-orange-600'}>
                      {audit.status === 'compliant' ? '✓ OK' : '⚠ Warnung'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 ml-8">
                    <span>Score: {audit.score}%</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {audit.lastAudit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{audit.score}%</div>
                  <Button size="sm" variant="outline">Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}