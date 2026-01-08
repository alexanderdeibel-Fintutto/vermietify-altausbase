import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, FileText, CreditCard, AlertCircle } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function TenantPortalPage() {
  const messages = [
    { id: 1, from: 'Hausverwaltung', subject: 'Wartungstermin vereinbaren', unread: true, date: 'Heute' },
    { id: 2, from: 'Nachbar', subject: 'Lärmbeschwerden', unread: false, date: 'Gestern' },
    { id: 3, from: 'Hausverwaltung', subject: 'Nebenkostenabrechnung', unread: false, date: '5. Jan' },
  ];

  const documents = [
    { name: 'Mietvertrag', date: '2024-06-01', status: 'active' },
    { name: 'Nebenkostenabrechnung', date: '2025-12-31', status: 'ready' },
    { name: 'Versicherungsbestätigung', date: '2025-01-01', status: 'active' },
  ];

  const stats = [
    { label: 'Ungelesene Nachrichten', value: 1 },
    { label: 'Offene Anfragen', value: 2 },
    { label: 'Verfügbare Dokumente', value: documents.length },
    { label: 'Status', value: 'Gültig ✓' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏠 Mieterportal</h1>
        <p className="text-slate-600 mt-1">Verwaltungsportal für Mieter</p>
      </div>

      <QuickStats stats={stats} accentColor="purple" />

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Nachrichten</h2>
          {messages.map((msg) => (
            <Card key={msg.id} className={`border ${msg.unread ? 'border-purple-300 bg-purple-50' : 'border-slate-200'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{msg.subject}</p>
                    <p className="text-xs text-slate-600">{msg.from} • {msg.date}</p>
                  </div>
                  {msg.unread && <Badge className="bg-purple-600">Neu</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5" /> Dokumente</h2>
          {documents.map((doc, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-600">{doc.date}</p>
                  </div>
                  <Badge className={doc.status === 'active' ? 'bg-green-600' : 'bg-blue-600'}>
                    {doc.status === 'active' ? '✓ Aktiv' : 'Verfügbar'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Zahlungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border border-green-200 bg-green-50 rounded-lg flex items-center justify-between">
              <span className="text-slate-900 font-semibold">Miete Dezember</span>
              <Badge className="bg-green-600">Bezahlt</Badge>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-slate-900 font-semibold">Nebenkosten Januar</span>
              <Badge className="bg-orange-600">Offen - €45,00</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}