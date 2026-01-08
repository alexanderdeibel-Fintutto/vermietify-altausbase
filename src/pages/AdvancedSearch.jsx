import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Sliders } from 'lucide-react';

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [status, setStatus] = useState('all');

  const results = [
    { type: 'Building', name: 'Gebäude A - Hauptstr. 10', id: 'BUILD-001', relevance: 98 },
    { type: 'Tenant', name: 'Meyer, Klaus', id: 'TENANT-045', relevance: 87 },
    { type: 'Contract', name: 'Mietvertrag 2026-001', id: 'CONTRACT-123', relevance: 92 },
    { type: 'Payment', name: 'Zahlung Jan 2026', id: 'PAY-456', relevance: 76 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔍 Advanced Search</h1>
        <p className="text-slate-600 mt-1">Durchsuchen Sie alle Daten der Anwendung</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suchfilter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Suchbegriff</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Gebäude, Mieter, Verträge..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Entity Type</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="building">Gebäude</SelectItem>
                  <SelectItem value="tenant">Mieter</SelectItem>
                  <SelectItem value="contract">Verträge</SelectItem>
                  <SelectItem value="payment">Zahlungen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700"><Search className="w-4 h-4 mr-2" />Suchen</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">{results.length} Ergebnisse gefunden</p>
        {results.map((result, idx) => (
          <Card key={idx} className="border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-800 rounded">{result.type}</span>
                    <span className="text-xs text-slate-500">{result.id}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{result.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600">Relevanz</p>
                  <p className="text-lg font-bold text-indigo-600">{result.relevance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}