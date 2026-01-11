import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Building2, Search } from 'lucide-react';

export default function LetterRecipientSelector({ onSelect = () => {} }) {
   const [filterType, setFilterType] = useState('tenant');
   const [searchQuery, setSearchQuery] = useState('');

  const recipients = [
    { id: 1, name: 'Max Müller', address: 'Hauptstr. 10', type: 'tenant' },
    { id: 2, name: 'Anna Schmidt', address: 'Hauptstr. 20', type: 'tenant' },
    { id: 3, name: 'Thomas Weber', address: 'Hauptstr. 10', type: 'tenant' },
    { id: 4, name: 'Alle Mieter', address: 'Alle Einheiten', type: 'all' },
    { id: 5, name: 'Gebäude 1', address: 'Hauptstr. 10', type: 'building' },
  ];

  const filtered = recipients.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    return r.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Empfänger auswählen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('tenant')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'tenant'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Mieter
          </button>
          <button
            onClick={() => setFilterType('building')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'building'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Gebäude
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Alle
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Empfänger suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filtered.map(recipient => (
            <button
              key={recipient.id}
              onClick={() => onSelect(recipient)}
              className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
            >
              <p className="font-medium text-sm">{recipient.name}</p>
              <p className="text-xs text-slate-600">{recipient.address}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}