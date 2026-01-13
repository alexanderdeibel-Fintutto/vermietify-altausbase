import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Eye, Trash2, RefreshCw } from 'lucide-react';
import ISTBookingCard from '@/components/shared/ISTBookingCard';
import SOLLBookingCard from '@/components/shared/SOLLBookingCard';
import HelpTooltip from '@/components/shared/HelpTooltip';
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
    { id: 6, description: 'IST Zahlung Miete - WE A1', amount: 1200, date: '2026-01-02', source: 'Bank Transaction', status: 'matched' },
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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900">📋 Geplante Einnahmen/Ausgaben (SOLL)</h1>
            <HelpTooltip text="Erstellt automatische SOLL-Buchungen basierend auf Verträgen. Diese müssen mit tatsächlichen Bank-Zahlungen (IST) abgeglichen werden." />
           </div>
          <p className="text-slate-600 mt-1">Automatisch erstellte Finanzbuchungen aus Verträgen und Dokumenten</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700"><RefreshCw className="w-4 h-4 mr-2" />Buchungen generieren</Button>
      </div>

      <QuickStats stats={stats} accentColor="violet" />

      <div className="space-y-3">
        {bookings.map((booking) => (
          {booking.status === 'matched' ? (
            <ISTBookingCard title={booking.description} amount={booking.amount} date={format(new Date(booking.date), 'dd.MM.yyyy', { locale: de })} />
          ) : (
            <SOLLBookingCard title={booking.description} amount={booking.amount} date={format(new Date(booking.date), 'dd.MM.yyyy', { locale: de })} />
          )}
        ))}
      </div>
    </div>
  );
}