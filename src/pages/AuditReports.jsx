import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, User } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AuditReportsPage() {
  const reports = [
    { id: 1, name: 'Dezember 2025', date: '2025-12-31', generatedBy: 'Admin', entries: 1254, size: '2.4 MB', status: 'completed' },
    { id: 2, name: 'November 2025', date: '2025-11-30', generatedBy: 'System', entries: 987, size: '1.8 MB', status: 'completed' },
    { id: 3, name: 'Oktober 2025', date: '2025-10-31', generatedBy: 'Admin', entries: 1102, size: '2.1 MB', status: 'completed' },
    { id: 4, name: 'September 2025', date: '2025-09-30', generatedBy: 'System', entries: 856, size: '1.6 MB', status: 'completed' },
  ];

  const stats = [
    { label: 'Gesamte Reports', value: reports.length },
    { label: 'Gesamt Einträge', value: reports.reduce((sum, r) => sum + r.entries, 0).toLocaleString('de-DE') },
    { label: 'Gesamt Größe', value: (reports.reduce((sum, r) => sum + parseFloat(r.size), 0)).toFixed(1) + ' GB' },
    { label: 'Letzte Aktualisierung', value: 'Vor 4 Std.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📋 Audit Reports</h1>
          <p className="text-slate-600 mt-1">Vollständige Audit-Logs und Compliance Reports</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700"><FileText className="w-4 h-4 mr-2" />Neue Abfrage</Button>
      </div>

      <QuickStats stats={stats} accentColor="teal" />

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id} className="border border-slate-200 hover:border-slate-300 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{report.name}</h3>
                    <Badge className="bg-green-600">✓ Verfügbar</Badge>
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(report.date), 'dd.MM.yyyy', { locale: de })}</span>
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {report.generatedBy}</span>
                    <span>📊 {report.entries.toLocaleString('de-DE')} Einträge</span>
                    <span>💾 {report.size}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700"><Download className="w-4 h-4 mr-2" />Download</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}