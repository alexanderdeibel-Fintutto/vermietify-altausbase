import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import QuickStats from '@/components/shared/QuickStats';

export default function ComplianceCenterPage() {
  const complianceItems = [
    { name: 'DSGVO Datenschutz', status: 'compliant', completeness: 95, lastCheck: '2026-01-07' },
    { name: 'Steuerliche Aufzeichnungspflicht', status: 'compliant', completeness: 100, lastCheck: '2026-01-07' },
    { name: 'BetrKV Betriebskostenverordnung', status: 'warning', completeness: 78, lastCheck: '2026-01-05' },
    { name: 'Mietrecht Rechtlichkeit', status: 'compliant', completeness: 92, lastCheck: '2026-01-06' },
    { name: 'GoBD Buchhaltung Standards', status: 'warning', completeness: 85, lastCheck: '2026-01-04' },
  ];

  const stats = [
    { label: 'Compliant', value: complianceItems.filter(c => c.status === 'compliant').length },
    { label: 'Warnungen', value: complianceItems.filter(c => c.status === 'warning').length },
    { label: 'Durchschn. Vollständigkeit', value: Math.round(complianceItems.reduce((sum, c) => sum + c.completeness, 0) / complianceItems.length) + '%' },
    { label: 'Letzte Prüfung', value: 'Vor 2 Tg.' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'compliant': return <Badge className="bg-green-600">✓ Konform</Badge>;
      case 'warning': return <Badge className="bg-yellow-600">⚠ Warnung</Badge>;
      case 'error': return <Badge className="bg-red-600">✗ Fehler</Badge>;
      default: return <Badge>Unbekannt</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🛡️ Compliance Center</h1>
        <p className="text-slate-600 mt-1">Überwachen Sie Ihre Compliance und rechtliche Anforderungen</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Compliance-Prüfungen werden täglich automatisch durchgeführt. Letzte Prüfung: Heute um 02:00 Uhr.
        </AlertDescription>
      </Alert>

      <QuickStats stats={stats} accentColor="yellow" />

      <div className="space-y-3">
        {complianceItems.map((item, idx) => (
          <Card key={idx} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <span className="text-sm text-slate-600">{item.completeness}%</span>
                </div>
                <Progress value={item.completeness} className="h-2" />
                <p className="text-xs text-slate-500">Letzte Prüfung: {item.lastCheck}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900"><AlertTriangle className="w-5 h-5" /> Offene Punkte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white border border-yellow-200 rounded-lg">
            <p className="font-semibold text-slate-900">BetrKV: Abrechnungserstellung</p>
            <p className="text-sm text-slate-700 mt-1">Folgende Betriebskostenabrechnungen sind überfällig:</p>
            <ul className="text-sm text-slate-700 mt-2 ml-4 list-disc">
              <li>Gebäude A - 2025 Abrechnung (Fällig: 31.01.26)</li>
              <li>Gebäude B - Q4 2025 Abrechnung (Fällig: 28.02.26)</li>
            </ul>
          </div>
          <Button className="w-full bg-yellow-600 hover:bg-yellow-700">Zu Betriebskostenabrechnungen</Button>
        </CardContent>
      </Card>
    </div>
  );
}