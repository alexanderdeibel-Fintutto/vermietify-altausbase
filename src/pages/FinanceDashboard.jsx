import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SOLLISTSeparation from '@/components/finance/SOLLISTSeparation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Clock,
  Euro,
  FileText,
  Plus
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

export default function FinanceDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: plannedBookings = [] } = useQuery({
    queryKey: ['plannedBookings'],
    queryFn: () => base44.entities.PlannedBooking.list('-faelligkeitsdatum', 100)
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-rechnungsdatum', 50)
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  // Berechnungen
  const offeneForderungen = plannedBookings
    .filter(b => b.betrag > 0 && b.zahlungsstatus === 'Offen')
    .reduce((sum, b) => sum + (b.betrag - (b.bezahlt_betrag || 0)), 0);

  const offeneVerbindlichkeiten = plannedBookings
    .filter(b => b.betrag < 0 && b.zahlungsstatus === 'Offen')
    .reduce((sum, b) => sum + Math.abs(b.betrag - (b.bezahlt_betrag || 0)), 0);

  const ueberfaellig = plannedBookings.filter(b => 
    b.zahlungsstatus === 'Offen' && 
    isBefore(new Date(b.faelligkeitsdatum), new Date())
  );

  const offeneRechnungen = invoices.filter(i => i.zahlungsstatus === 'Offen');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Finanzen</h1>
        <p className="text-slate-500 mt-1">Übersicht Einnahmen & Ausgaben</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Offene Forderungen</p>
                <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(offeneForderungen)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Offene Verbindlichkeiten</p>
                <p className="text-2xl font-semibold text-red-600">{formatCurrency(offeneVerbindlichkeiten)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Überfällig</p>
                <p className="text-2xl font-semibold text-orange-600">{ueberfaellig.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Offene Rechnungen</p>
                <p className="text-2xl font-semibold text-blue-600">{offeneRechnungen.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SOLL/IST Separation */}
      <SOLLISTSeparation buildingId={selectedBuilding} />

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">SOLL-Buchungen</TabsTrigger>
          <TabsTrigger value="invoices">Rechnungen</TabsTrigger>
          <TabsTrigger value="overdue">Überfällig</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SOLL-Buchungen</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Buchung
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plannedBookings.slice(0, 20).map(booking => (
                  <div 
                    key={booking.id} 
                    className={`p-4 rounded-lg border ${
                      booking.zahlungsstatus === 'Offen' && isBefore(new Date(booking.faelligkeitsdatum), new Date())
                        ? 'border-red-200 bg-red-50'
                        : booking.zahlungsstatus === 'Bezahlt'
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{booking.buchungstext}</p>
                          <Badge variant="outline" className="text-xs">
                            {booking.buchungstyp}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Fällig: {format(new Date(booking.faelligkeitsdatum), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${booking.betrag > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(booking.betrag)}
                        </p>
                        <Badge className={
                          booking.zahlungsstatus === 'Bezahlt' ? 'bg-emerald-100 text-emerald-700' :
                          booking.zahlungsstatus === 'Teilbezahlt' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {booking.zahlungsstatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rechnungen</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Rechnung erfassen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{invoice.lieferant_name}</p>
                        <p className="text-sm text-slate-600">
                          Rechnung {invoice.rechnungsnummer || 'ohne Nr.'} • {format(new Date(invoice.rechnungsdatum), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">{formatCurrency(invoice.betrag_brutto)}</p>
                        <Badge className={
                          invoice.zahlungsstatus === 'Bezahlt' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }>
                          {invoice.zahlungsstatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Überfällige Posten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ueberfaellig.length === 0 ? (
                <p className="text-sm text-slate-500">Keine überfälligen Buchungen</p>
              ) : (
                <div className="space-y-2">
                  {ueberfaellig.map(booking => (
                    <div key={booking.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-red-900">{booking.buchungstext}</p>
                          <p className="text-sm text-red-700">
                            Überfällig seit {format(new Date(booking.faelligkeitsdatum), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-red-600">{formatCurrency(booking.betrag)}</p>
                          {booking.mahnstufe > 0 && (
                            <Badge className="bg-red-600 text-white">Mahnstufe {booking.mahnstufe}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}