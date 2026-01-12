import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Euro } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { useLazyLoadedList } from '@/components/hooks/useLazyLoadedList';
import { base44 } from '@/api/base44Client';

export default function OptimizedFinanceList({ buildingId, filterStatus = 'all' }) {
  const {
    data: bookings,
    isLoading,
    isLoadingMore,
    hasMore,
    observerTarget
  } = useLazyLoadedList(
    async (skip, limit) => {
      const filter = buildingId ? { building_id: buildingId } : {};
      const allBookings = await base44.entities.PlannedBooking.list('-faelligkeitsdatum', 500);
      return allBookings.slice(skip, skip + limit);
    },
    {
      pageSize: 20,
      queryKey: ['plannedBookingsLazy', buildingId, filterStatus]
    }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const filteredBookings = bookings?.filter(b => {
    if (filterStatus === 'all') return true;
    return b.zahlungsstatus === filterStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredBookings.map(buchung => {
        const isOverdue = buchung.zahlungsstatus === 'Offen' && isBefore(new Date(buchung.faelligkeitsdatum), new Date());
        
        return (
          <Card 
            key={buchung.id}
            className={
              isOverdue ? 'border-red-200 bg-red-50' :
              buchung.zahlungsstatus === 'Bezahlt' ? 'border-emerald-200 bg-emerald-50' :
              'border-slate-200 hover:border-slate-300 transition-colors'
            }
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {buchung.buchungstyp}
                    </Badge>
                    <p className="font-medium text-slate-900">{buchung.buchungstext}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(buchung.faelligkeitsdatum), 'dd.MM.yyyy', { locale: de })}
                    </span>
                    {buchung.ist_periodisch && (
                      <Badge variant="outline" className="text-xs">{buchung.periode_rhythmus}</Badge>
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
                    isOverdue ? 'bg-red-600 mt-1' :
                    'bg-slate-400 mt-1'
                  }>
                    {buchung.zahlungsstatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {isLoadingMore ? (
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-4 border-slate-300 border-t-slate-600 rounded-full mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Lade weitere...</p>
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}

      {!hasMore && filteredBookings.length > 0 && (
        <p className="text-center text-sm text-slate-500 py-4">
          Alle Buchungen geladen ({filteredBookings.length})
        </p>
      )}

      {filteredBookings.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Keine Buchungen gefunden
          </CardContent>
        </Card>
      )}
    </div>
  );
}