import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function DataImportExportPage() {
  const exports = [
    { name: 'Vollständige Datenbank Backup', date: '2026-01-08', size: '245 MB', status: 'ready' },
    { name: 'Gebäudebestand Export', date: '2026-01-07', size: '12.5 MB', status: 'ready' },
    { name: 'Mieterverwaltung Export', date: '2026-01-06', size: '8.3 MB', status: 'ready' },
  ];

  const imports = [
    { name: 'Bank-Transaktionen Import', date: '2026-01-08', status: 'completed', records: 156 },
    { name: 'Mieterdata Migration', date: '2026-01-05', status: 'completed', records: 24 },
    { name: 'Gebäudedaten Import', date: '2025-12-20', status: 'completed', records: 3 },
  ];

  const stats = [
    { label: 'Verfügbare Exports', value: exports.length },
    { label: 'Letzte Sicherung', value: 'Heute' },
    { label: 'Importierte Datensätze (Monat)', value: '183' },
    { label: 'Speicherverbrauch', value: '2.4 GB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📊 Datenimport/-export</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Datensicherungen und Importe</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Exportieren</Button>
          <Button className="bg-blue-600 hover:bg-blue-700"><Upload className="w-4 h-4 mr-2" />Importieren</Button>
        </div>
      </div>

      <QuickStats stats={stats} accentColor="indigo" />

      <Tabs defaultValue="export">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Exports</TabsTrigger>
          <TabsTrigger value="import">Imports</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-3">
          <Card className="border border-slate-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">Neue Datensicherung erstellen</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Sicherung jetzt durchführen</Button>
            </CardContent>
          </Card>

          {exports.map((exp, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">{exp.name}</h3>
                      <Badge className="bg-green-600">✓ Bereit</Badge>
                    </div>
                    <p className="text-xs text-slate-600">{exp.date} • {exp.size}</p>
                  </div>
                  <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="import" className="space-y-3">
          <Card className="border border-slate-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">Datei hochladen und importieren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">CSV oder Excel Datei hierher ziehen</p>
                <p className="text-xs text-slate-600">oder klicken zum Auswählen</p>
              </div>
            </CardContent>
          </Card>

          {imports.map((imp, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">{imp.name}</h3>
                      <Badge className="bg-green-600">✓ Abgeschlossen</Badge>
                    </div>
                    <p className="text-xs text-slate-600">{imp.date} • {imp.records} Datensätze importiert</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}