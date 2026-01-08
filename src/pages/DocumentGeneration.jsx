import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Download, Eye } from 'lucide-react';

export default function DocumentGenerationPage() {
  const templates = [
    { id: 1, name: 'Mietvertrag', type: 'Contract', lastUsed: '05.01.2026', uses: 24 },
    { id: 2, name: 'Nebenkostenabrechnung', type: 'Report', lastUsed: '04.01.2026', uses: 12 },
    { id: 3, name: 'Mieterhöhung', type: 'Notice', lastUsed: '31.12.2025', uses: 8 },
    { id: 4, name: 'Kündigungsschreiben', type: 'Notice', lastUsed: '28.12.2025', uses: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📄 Dokumentenerstellung</h1>
          <p className="text-slate-600 mt-1">Automatische Generierung von juristischen Dokumenten</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Neues Dokument</Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Template-Katalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {template.name}
                  </h3>
                  <Badge variant="outline">{template.type}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">Zuletzt: {template.lastUsed} • {template.uses}x verwendet</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1"><Eye className="w-3 h-3 mr-1" />Vorschau</Button>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Generieren</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Generierungsassistent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Dokumenttyp</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option>Mietvertrag</option>
                <option>Nebenkostenabrechnung</option>
                <option>Mieterhöhung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Mieter/Objekt</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option>Klaus Meyer - Wohnung 1A</option>
                <option>Jane Smith - Wohnung 2B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Gültig ab</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700"><FileText className="w-4 h-4 mr-2" />Generieren</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle>Kürzliche Dokumente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: 'Mietvertrag_Meyer_2026.pdf', date: 'Heute 14:30', size: '245 KB' },
            { name: 'Abrechnung_Q4_2025.pdf', date: 'Heute 10:15', size: '156 KB' },
            { name: 'Mieterhöhung_Smith_2026.pdf', date: 'Gestern 16:45', size: '89 KB' },
          ].map((doc, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-600">{doc.date} • {doc.size}</p>
              </div>
              <Button size="sm" variant="ghost"><Download className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}