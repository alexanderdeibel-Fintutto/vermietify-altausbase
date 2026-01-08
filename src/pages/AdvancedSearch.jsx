import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Zap } from 'lucide-react';

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');

  const searchResults = [
    { type: 'Mieter', title: 'Klaus Meyer', snippet: 'Wohnung 2B • Aktiv seit 01.03.2020' },
    { type: 'Mietvertrag', title: 'Vertrag Meyer - 2B', snippet: 'Gültig von 01.03.2020 bis 28.02.2025' },
    { type: 'Transaktion', title: 'Mietzahlung Januar 2026', snippet: '€1.450,00 • 08.01.2026' },
    { type: 'Dokument', title: 'Nebenkosten 2025', snippet: 'Abrechnung • Wohnung 2B' },
  ];

  const recentSearches = ['Mieter Meyer', 'Nebenkosten 2025', 'Wartungsticket 456', 'Mietvertrag'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔍 Erweiterte Suche</h1>
        <p className="text-slate-600 mt-1">Durchsuchen Sie alle Daten und Dokumente</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
        <Input 
          placeholder="Suchen Sie nach Mietern, Dokumenten, Transaktionen..." 
          className="pl-12 h-12 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['Mieter', 'Mietverträge', 'Transaktionen', 'Dokumente'].map((filter, idx) => (
          <Button key={idx} variant="outline" className="text-sm">{filter}</Button>
        ))}
      </div>

      {query ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Ergebnisse für "{query}"</p>
          {searchResults.map((result, idx) => (
            <Card key={idx} className="border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
              <CardContent className="pt-6 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{result.title}</h3>
                    <Badge variant="outline" className="text-xs">{result.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{result.snippet}</p>
                </div>
                <Button size="sm" variant="ghost">→</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Kürzliche Suchanfragen</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <Button key={idx} variant="outline" size="sm">{search}</Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Schnelle Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Alle Mieter', 'Offene Wartungen', 'Unzahlte Rechnungen', 'Aktive Mietverträge'].map((link, idx) => (
                <Button key={idx} variant="outline" size="sm" className="justify-start">{link}</Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}