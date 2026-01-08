import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Download, RotateCcw, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BackupRecoveryPage() {
  const backups = [
    { id: 1, name: 'Automatisches Backup', date: '08.01.2026 02:00', size: '456 MB', status: 'completed', type: 'auto' },
    { id: 2, name: 'Automatisches Backup', date: '07.01.2026 02:00', size: '445 MB', status: 'completed', type: 'auto' },
    { id: 3, name: 'Manuelles Backup - vor Update', date: '05.01.2026 14:30', size: '440 MB', status: 'completed', type: 'manual' },
    { id: 4, name: 'Automatisches Backup', date: '04.01.2026 02:00', size: '438 MB', status: 'completed', type: 'auto' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💾 Sicherung & Wiederherstellung</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Backups und Datensicherungen</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700"><HardDrive className="w-4 h-4 mr-2" />Jetzt sichern</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <HardDrive className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Backups gesamt</p>
            <p className="text-2xl font-bold text-slate-900">4</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Letztes Backup</p>
            <p className="text-sm font-bold text-slate-900">08.01.2026</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Status</p>
            <p className="text-sm font-bold text-green-600">Gesund</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle>Automatische Backups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Täglich um 02:00 Uhr</p>
              <p className="text-xs text-slate-600">Vollständige Datenbanksicherung</p>
            </div>
            <Badge className="bg-green-600">Aktiviert</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Aufbewahrungsdauer</p>
              <p className="text-xs text-slate-600">Letzte 30 Tage</p>
            </div>
            <Button size="sm" variant="outline">Ändern</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Verfügbare Backups</h3>
        <div className="space-y-2">
          {backups.map((backup) => (
            <Card key={backup.id} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{backup.name}</p>
                    <Badge variant="outline" className="text-xs">{backup.type === 'auto' ? 'Auto' : 'Manuell'}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{backup.date} • {backup.size}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline"><RotateCcw className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Backups werden täglich um 02:00 Uhr erstellt. Regelmäßige Tests werden empfohlen.</p>
        </CardContent>
      </Card>
    </div>
  );
}