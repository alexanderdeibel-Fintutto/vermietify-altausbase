import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataImportExportHubPage() {
  const exports = [
    { id: 1, name: 'Alle Mieter 2026', type: 'CSV', date: '08.01.2026', size: '245 KB', status: 'completed' },
    { id: 2, name: 'Finanzbericht Q1', type: 'Excel', date: '05.01.2026', size: '1.2 MB', status: 'completed' },
    { id: 3, name: 'Mietverträge Archiv', type: 'ZIP', date: '02.01.2026', size: '5.6 MB', status: 'completed' },
  ];

  const imports = [
    { id: 1, name: 'Transaktionen_Jan2026.csv', date: '08.01.2026', records: 234, status: 'processing' },
    { id: 2, name: 'Mieter_Namenänderungen.xlsx', date: '07.01.2026', records: 12, status: 'completed' },
    { id: 3, name: 'Nebenkosten_2025.csv', date: '05.01.2026', records: 8, status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📤 Import/Export Hub</h1>
        <p className="text-slate-600 mt-1">Datenimport und -export verwalten</p>
      </div>

      <Tabs defaultValue="export">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="flex items-center gap-2"><Download className="w-4 h-4" /> Export</TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Neuer Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Zu exportierende Daten</label>
                <div className="space-y-2">
                  {['Mieter', 'Mietverträge', 'Transaktionen', 'Nebenkosten', 'Wartungstickets'].map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input type="checkbox" /> {item}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Format</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>CSV</option>
                  <option>Excel</option>
                  <option>PDF</option>
                  <option>JSON</option>
                </select>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700"><Download className="w-4 h-4 mr-2" />Export starten</Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {exports.map((exp) => (
              <Card key={exp.id} className="border border-slate-200">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{exp.name}</p>
                    <p className="text-xs text-slate-600">{exp.date} • {exp.size} • {exp.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Neuer Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-900">Datei hierher ziehen oder klicken</p>
                <p className="text-xs text-slate-600">CSV, Excel oder JSON unterstützt</p>
                <input type="file" className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Zielentität</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>Mieter</option>
                  <option>Transaktionen</option>
                  <option>Nebenkosten</option>
                </select>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700"><Upload className="w-4 h-4 mr-2" />Import starten</Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {imports.map((imp) => (
              <Card key={imp.id} className="border border-slate-200">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{imp.name}</p>
                    <p className="text-xs text-slate-600">{imp.date} • {imp.records} Records</p>
                  </div>
                  <Badge className={imp.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'}>
                    {imp.status === 'completed' ? '✓ OK' : '⏳ Läuft'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}