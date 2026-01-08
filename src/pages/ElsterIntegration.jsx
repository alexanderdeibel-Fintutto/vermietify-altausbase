import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Check, AlertTriangle, Upload, Download } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function ElsterIntegrationPage() {
  const submissions = [
    { year: 2025, form: 'Anlage V', status: 'submitted', transferId: 'TID-2025-001', date: '2026-01-05' },
    { year: 2024, form: 'Anlage V', status: 'accepted', transferId: 'TID-2024-001', date: '2025-06-15' },
    { year: 2025, form: 'Euer', status: 'draft', transferId: null, date: null },
  ];

  const stats = [
    { label: 'Eingereichte Formulare', value: 2 },
    { label: 'Akzeptiert', value: 1 },
    { label: 'Im Entwurf', value: 1 },
    { label: 'Fehler', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🏛️ ELSTER Integration</h1>
          <p className="text-slate-600 mt-1">Direktes Einreichen von Steuerformularen an ELSTER</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700"><Upload className="w-4 h-4 mr-2" />Zum ELSTER einreichen</Button>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Das ELSTER-Zertifikat läuft am 31.12.2026 ab. Bitte erneuern Sie es rechtzeitig.
        </AlertDescription>
      </Alert>

      <QuickStats stats={stats} accentColor="red" />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Zertifikat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">Status: Aktiv ✓</p>
              <p className="text-xs text-slate-600">Gültig bis: 31.12.2026</p>
            </div>
            <Button variant="outline" className="w-full">🔄 Zertifikat erneuern</Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Verbindung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">Verbunden ✓</p>
              <p className="text-xs text-slate-600">Letzter Test: Heute 10:30</p>
            </div>
            <Button variant="outline" className="w-full">🧪 Verbindung testen</Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-slate-900">Einreichungshistorie</h2>
        {submissions.map((sub, idx) => (
          <Card key={idx} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-slate-900">{sub.form} {sub.year}</h3>
                    <Badge className={
                      sub.status === 'submitted' ? 'bg-blue-600' : 
                      sub.status === 'accepted' ? 'bg-green-600' : 
                      'bg-slate-600'
                    }>
                      {sub.status === 'submitted' ? '📤 Eingereicht' : 
                       sub.status === 'accepted' ? '✓ Akzeptiert' : 
                       'Entwurf'}
                    </Badge>
                  </div>
                  {sub.transferId && (
                    <p className="text-xs text-slate-600 ml-8">Transfer ID: {sub.transferId} • {sub.date}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}