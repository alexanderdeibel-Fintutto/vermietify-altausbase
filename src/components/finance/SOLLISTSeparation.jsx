import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, AlertCircle, Euro, TrendingUp, TrendingDown } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SOLLISTSeparation({ buildingId }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: sollBuchungen = [] } = useQuery({
    queryKey: ['plannedBookings', buildingId],
    queryFn: () => buildingId 
      ? base44.entities.PlannedBooking.filter({ building_id: buildingId }, '-faelligkeitsdatum', 200)
      : base44.entities.PlannedBooking.list('-faelligkeitsdatum', 200)
  });

  const { data: istZahlungen = [] } = useQuery({
    queryKey: ['actualPayments', buildingId],
    queryFn: () => buildingId
      ? base44.entities.ActualPayment.filter({ building_id: buildingId }, '-zahlungsdatum', 200)
      : base44.entities.ActualPayment.list('-zahlungsdatum', 200)
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const offene = sollBuchungen.filter(b => b.zahlungsstatus === 'Offen');
  const ueberfaellig = offene.filter(b => isBefore(new Date(b.faelligkeitsdatum), new Date()));
  const bezahlt = sollBuchungen.filter(b => b.zahlungsstatus === 'Bezahlt');

  const summeSOLL = sollBuchungen.reduce((sum, b) => sum + b.betrag, 0);
  const summeIST = istZahlungen.reduce((sum, z) => sum + z.betrag, 0);
  const differenz = summeIST - summeSOLL;

  return (
    <div className="space-y-6">
      {/* Zusammenfassung */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">SOLL (Erwartet)</p>
                <p className="text-2xl font-semibold text-blue-900">{formatCurrency(summeSOLL)}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-medium">IST (Tatsächlich)</p>
                <p className="text-2xl font-semibold text-emerald-900">{formatCurrency(summeIST)}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={differenz >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: differenz >= 0 ? '#059669' : '#dc2626' }}>
                  Differenz
                </p>
                <p className="text-2xl font-semibold" style={{ color: differenz >= 0 ? '#065f46' : '#991b1b' }}>
                  {formatCurrency(differenz)}
                </p>
              </div>
              {differenz >= 0 ? (
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="soll">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="soll" className="relative">
            SOLL-Buchungen
            {offene.length > 0 && (
              <Badge className="ml-2 bg-blue-600">{offene.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ist">IST-Zahlungen</TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Überfällig
            {ueberfaellig.length > 0 && (
              <Badge className="ml-2 bg-red-600">{ueberfaellig.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="match">Zuordnung</TabsTrigger>
        </TabsList>

        <TabsContent value="soll" className="space-y-3">
          {sollBuchungen.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Keine SOLL-Buchungen vorhanden
              </CardContent>
            </Card>
          ) : (
            sollBuchungen.map(buchung => (
              <Card key={buchung.id} className={
                buchung.zahlungsstatus === 'Bezahlt' ? 'border-emerald-200 bg-emerald-50' :
                isBefore(new Date(buchung.faelligkeitsdatum), new Date()) ? 'border-red-200 bg-red-50' :
                'border-slate-200'
              }>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{buchung.buchungstyp}</Badge>
                        <p className="font-medium text-slate-900">{buchung.buchungstext}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(buchung.faelligkeitsdatum), 'dd.MM.yyyy', { locale: de })}
                        </span>
                        {buchung.ist_periodisch && (
                          <Badge variant="outline" className="text-xs">
                            {buchung.periode_rhythmus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${buchung.betrag > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(buchung.betrag)}
                      </p>
                      <Badge className={
                        buchung.zahlungsstatus === 'Bezahlt' ? 'bg-emerald-600 mt-1' :
                        buchung.zahlungsstatus === 'Teilbezahlt' ? 'bg-yellow-600 mt-1' :
                        'bg-slate-400 mt-1'
                      }>
                        {buchung.zahlungsstatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="ist" className="space-y-3">
          {istZahlungen.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Keine IST-Zahlungen erfasst
              </CardContent>
            </Card>
          ) : (
            istZahlungen.map(zahlung => (
              <Card key={zahlung.id} className="border-emerald-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <p className="font-medium text-slate-900">
                          {zahlung.zahler_name || zahlung.verwendungszweck || 'Zahlung'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span>{format(new Date(zahlung.zahlungsdatum), 'dd.MM.yyyy', { locale: de })}</span>
                        <Badge variant="outline" className="text-xs">{zahlung.zahlungsart}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${zahlung.betrag > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(zahlung.betrag)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3">
          {ueberfaellig.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-emerald-600">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                Keine überfälligen Buchungen
              </CardContent>
            </Card>
          ) : (
            ueberfaellig.map(buchung => {
              const tageUeberfaellig = Math.floor((new Date() - new Date(buchung.faelligkeitsdatum)) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={buchung.id} className="border-red-300 bg-red-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <p className="font-medium text-red-900">{buchung.buchungstext}</p>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          Überfällig seit {tageUeberfaellig} Tag{tageUeberfaellig !== 1 ? 'en' : ''}
                        </p>
                        {buchung.mahnstufe > 0 && (
                          <Badge className="bg-red-600 text-white mt-2">
                            Mahnstufe {buchung.mahnstufe}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(buchung.betrag)}</p>
                        <Button size="sm" className="mt-2">
                          Mahnung erstellen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="match">
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              Zuordnungsfunktion wird implementiert...
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}