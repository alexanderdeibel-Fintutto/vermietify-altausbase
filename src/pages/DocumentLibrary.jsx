import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Download, Share2, Trash2, Search, Plus } from 'lucide-react';

export default function DocumentLibraryPage() {
  const documents = [
    { id: 1, name: 'Mietvertrag Template', type: 'Template', date: '2026-01-05', size: '245 KB', downloads: 24 },
    { id: 2, name: 'Nebenkostenabrechnung', type: 'Form', date: '2026-01-04', size: '156 KB', downloads: 18 },
    { id: 3, name: 'Hausordnung', type: 'Policy', date: '2025-12-15', size: '89 KB', downloads: 12 },
    { id: 4, name: 'Kaution-Vereinbarung', type: 'Template', date: '2025-11-30', size: '134 KB', downloads: 8 },
    { id: 5, name: 'Wartungs-Checkliste', type: 'Form', date: '2025-10-20', size: '112 KB', downloads: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📚 Dokumentenbibliothek</h1>
          <p className="text-slate-600 mt-1">Zentrale Verwaltung aller Dokumente und Templates</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Upload</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input placeholder="Dokumente suchen..." className="pl-10" />
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                    <div className="flex gap-3 text-xs text-slate-600 mt-1">
                      <span>📅 {doc.date}</span>
                      <span>📦 {doc.size}</span>
                      <Badge variant="outline">{doc.type}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{doc.downloads} Downloads</span>
                  <Button size="icon" variant="ghost"><Download className="w-4 h-4 text-blue-600" /></Button>
                  <Button size="icon" variant="ghost"><Share2 className="w-4 h-4 text-green-600" /></Button>
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