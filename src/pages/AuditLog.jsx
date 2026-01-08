import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';

export default function AuditLogPage() {
  const logs = [
    { id: 1, user: 'Admin User', action: 'Created', entity: 'Mieter - Klaus Meyer', timestamp: '08.01.2026 14:23', details: 'Neue Mieter hinzugefügt' },
    { id: 2, user: 'Max Müller', action: 'Updated', entity: 'Mietvertrag #456', timestamp: '08.01.2026 12:15', details: 'Enddatum aktualisiert' },
    { id: 3, user: 'Admin User', action: 'Deleted', entity: 'Dokument - Alt_File.pdf', timestamp: '07.01.2026 10:45', details: 'Veraltete Datei gelöscht' },
    { id: 4, user: 'Jane Smith', action: 'Viewed', entity: 'Mieter Details - Meyer', timestamp: '07.01.2026 09:30', details: 'Bericht angesehen' },
    { id: 5, user: 'Admin User', action: 'Exported', entity: 'Alle Transaktionen 2025', timestamp: '06.01.2026 16:20', details: 'Jahresbericht exportiert' },
  ];

  const getActionColor = (action) => {
    switch(action) {
      case 'Created': return 'bg-green-600';
      case 'Updated': return 'bg-blue-600';
      case 'Deleted': return 'bg-red-600';
      case 'Viewed': return 'bg-slate-600';
      case 'Exported': return 'bg-purple-600';
      default: return 'bg-slate-600';
    }
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'Created': return <Plus className="w-4 h-4" />;
      case 'Updated': return <Edit2 className="w-4 h-4" />;
      case 'Deleted': return <Trash2 className="w-4 h-4" />;
      case 'Viewed': return <Eye className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📋 Audit Log</h1>
        <p className="text-slate-600 mt-1">Vollständige Aktivitätshistorie und Änderungsnachverfolgung</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="Nach Entity, User oder Aktion suchen..." className="pl-10" />
        </div>
        <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option>Alle Aktionen</option>
          <option>Created</option>
          <option>Updated</option>
          <option>Deleted</option>
        </select>
        <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`${getActionColor(log.action)} p-2 rounded-lg text-white flex-shrink-0`}>
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{log.entity}</p>
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{log.details}</p>
                  <p className="text-xs text-slate-500 mt-1">{log.user} • {log.timestamp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}