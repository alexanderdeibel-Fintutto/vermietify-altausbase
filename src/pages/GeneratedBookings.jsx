import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Eye, Trash2, RefreshCw } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function GeneratedBookingsPage() {
  const bookings = [
    { id: 1, description: 'Mietzahlung - Wohneinheit A1', amount: 1200, date: '2026-01-01', source: 'Contract', status: 'verified' },
    { id: 2, description: 'Nebenkosten - Gebäude A', amount: 450, date: '2026-01-05', source: 'Operating Cost', status: 'verified' },
    { id: 3, description: 'Versicherungsprämie Q1', amount: 2500, date: '2026-01-01', source: 'Insurance', status: 'pending' },
    { id: 4, description: 'Reparatur - Dach', amount: 850, date: '2026-01-03', source: 'Maintenance', status: 'pending' },
    { id: 5, description: 'Hausverwaltungsgebühr', amount: 300, date: '2026-01-10', source: 'Admin', status: 'verified' },
  ];

  const stats = [
    { label: 'Buchungen (Monat)', value: bookings.length },
    { label: 'Verifiziert', value: bookings.filter(b => b.status === 'verified').length },
    { label: 'Ausstehend', value: bookings.filter(b => b.status === 'pending').length },
    { label: 'Gesamtbetrag', value: '€' + bookings.reduce((sum, b) => sum + b.amount, 0).toLocaleString('de-DE') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚡ Automatisch generierte Buchungen</h1>
          <p className="text-slate-600 mt-1">KI-generierte Finanzbuchungen aus Verträgen und Dokumenten</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700"><RefreshCw className="w-4 h-4 mr-2" />Neu generieren</Button>
      </div>

      <QuickStats stats={stats} accentColor="violet" />

      <div className="space-y-3">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-slate-900">{booking.description}</h3>
                    <Badge className={booking.status === 'verified' ? 'bg-green-600' : 'bg-orange-600'}>
                      {booking.status === 'verified' ? '✓ Verifiziert' : 'Ausstehend'}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span>💶 {booking.amount.toLocaleString('de-DE')} €</span>
                    <span>📅 {format(new Date(booking.date), 'dd.MM.yyyy', { locale: de })}</span>
                    <span>🔗 {booking.source}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost"><Eye className="w-4 h-4 text-blue-600" /></Button>
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