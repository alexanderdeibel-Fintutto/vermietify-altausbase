import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Calendar, Trash2, Edit2 } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ReportSchedulingPage() {
  const reports = [
    { id: 1, name: 'Finanzübersicht', frequency: 'Monatlich', recipients: 'info@example.com', lastRun: '2026-01-01', nextRun: '2026-02-01', status: 'active' },
    { id: 2, name: 'Belegungsquote', frequency: 'Wöchentlich', recipients: 'team@example.com', lastRun: '2026-01-06', nextRun: '2026-01-13', status: 'active' },
    { id: 3, name: 'Vertragsablauf', frequency: 'Täglich', recipients: 'admin@example.com', lastRun: '2026-01-07', nextRun: '2026-01-08', status: 'active' },
    { id: 4, name: 'Jahresabschluss', frequency: 'Jährlich', recipients: 'cfo@example.com', lastRun: '2025-12-31', nextRun: '2026-12-31', status: 'scheduled' },
  ];

  const stats = [
    { label: 'Geplante Reports', value: reports.length },
    { label: 'Diese Woche', value: reports.filter(r => r.frequency !== 'Jährlich').length },
    { label: 'Aktiv', value: reports.filter(r => r.status === 'active').length },
    { label: 'Gesendet (Monat)', value: 12 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📅 Report-Planung</h1>
          <p className="text-slate-600 mt-1">Automatische Reports zeitgesteuert versenden</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />Neuer Report</Button>
      </div>

      <QuickStats stats={stats} accentColor="purple" />

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{report.name}</h3>
                    {report.status === 'active' ? (
                      <Badge className="bg-green-600">✓ Aktiv</Badge>
                    ) : (
                      <Badge className="bg-blue-600">Geplant</Badge>
                    )}
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {report.frequency}</span>
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {report.recipients}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Nächster Lauf: {format(new Date(report.nextRun), 'dd.MM.yyyy', { locale: de })}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                  <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}