import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function UserAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const audits = [
    { id: 1, user: 'Klaus Meyer', action: 'LOGIN', entity: 'User', details: 'Angemeldet von 192.168.1.1', timestamp: '2026-01-08 14:23:45', status: 'success' },
    { id: 2, user: 'Jane Smith', action: 'CREATE', entity: 'Building', details: 'Neues Gebäude erstellt: Hauptstr. 10', timestamp: '2026-01-08 13:15:30', status: 'success' },
    { id: 3, user: 'Klaus Meyer', action: 'UPDATE', entity: 'Tenant', details: 'Mieterdaten aktualisiert', timestamp: '2026-01-08 12:45:00', status: 'success' },
    { id: 4, user: 'Bob Wilson', action: 'DELETE', entity: 'Document', details: 'Dokument gelöscht', timestamp: '2026-01-08 11:30:20', status: 'success' },
    { id: 5, user: 'Alice Brown', action: 'EXPORT', entity: 'Report', details: 'Finanzbericht exportiert', timestamp: '2026-01-08 10:15:45', status: 'success' },
  ];

  const actionColors = {
    LOGIN: 'bg-blue-600',
    CREATE: 'bg-green-600',
    UPDATE: 'bg-orange-600',
    DELETE: 'bg-red-600',
    EXPORT: 'bg-purple-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">👥 Benutzer-Audit</h1>
        <p className="text-slate-600 mt-1">Überwachung aller Benutzeraktivitäten</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Nach Benutzer oder Aktion suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Aktionen</SelectItem>
            <SelectItem value="LOGIN">Anmeldung</SelectItem>
            <SelectItem value="CREATE">Erstellt</SelectItem>
            <SelectItem value="UPDATE">Aktualisiert</SelectItem>
            <SelectItem value="DELETE">Gelöscht</SelectItem>
            <SelectItem value="EXPORT">Exportiert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {audits.map((audit) => (
          <Card key={audit.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={actionColors[audit.action]}>{audit.action}</Badge>
                    <h3 className="font-semibold text-slate-900">{audit.user}</h3>
                    <span className="text-sm text-slate-600">{audit.entity}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{audit.details}</p>
                  <p className="text-xs text-slate-500">{audit.timestamp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}