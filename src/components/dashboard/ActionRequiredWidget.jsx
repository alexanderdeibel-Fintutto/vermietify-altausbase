import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ActionRequiredWidget() {
  const { data: leaseContracts = [] } = useQuery({
    queryKey: ['leaseContracts'],
    queryFn: async () => {
      const all = await base44.entities.LeaseContract.list();
      return all;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const all = await base44.entities.Invoice.list();
      return all;
    },
  });

  const { data: bankTransactions = [] } = useQuery({
    queryKey: ['bankTransactions'],
    queryFn: async () => {
      const all = await base44.entities.BankTransaction.list();
      return all;
    },
  });

  const { data: generatedBookings = [] } = useQuery({
    queryKey: ['generatedBookings'],
    queryFn: async () => {
      const all = await base44.entities.PlannedBooking.list();
      return all;
    },
  });

  // Berechne Action Items
  const contractsWithoutBookings = leaseContracts.filter(c => !c.bookings_generated).length;
  const invoicesWithoutCategory = invoices.filter(i => !i.cost_category).length;
  const unlinkedTransactions = bankTransactions.filter(t => !t.matched_booking_id).length;
  const incompleteBookings = generatedBookings.filter(b => !b.confirmed).length;

  const totalActions = contractsWithoutBookings + invoicesWithoutCategory + unlinkedTransactions + incompleteBookings;

  if (totalActions === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <p className="text-sm font-semibold text-green-800">✅ Alles erledigt!</p>
          <p className="text-xs text-green-700 mt-1">Keine ausstehenden Aufgaben</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
          <AlertTriangle className="w-4 h-4" />
          ⚠️ Handlungsbedarf
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contractsWithoutBookings > 0 && (
          <Alert className="bg-white border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>{contractsWithoutBookings}</strong> Vertrag{contractsWithoutBookings !== 1 ? 'e' : ''} ohne generierte Buchungen
              <Button
                variant="link"
                size="sm"
                onClick={() => window.location.href = createPageUrl('LeaseContracts')}
                className="text-amber-700 underline p-0 h-auto"
              >
                → Ansehen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {invoicesWithoutCategory > 0 && (
          <Alert className="bg-white border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>{invoicesWithoutCategory}</strong> Rechnung{invoicesWithoutCategory !== 1 ? 'en' : ''} ohne Kategorie
              <Button
                variant="link"
                size="sm"
                onClick={() => window.location.href = createPageUrl('Invoices')}
                className="text-amber-700 underline p-0 h-auto"
              >
                → Kategorisieren
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {unlinkedTransactions > 0 && (
          <Alert className="bg-white border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>{unlinkedTransactions}</strong> Bank-Transaktion{unlinkedTransactions !== 1 ? 'en' : ''} ohne Verknüpfung
              <Button
                variant="link"
                size="sm"
                onClick={() => window.location.href = createPageUrl('BankReconciliation')}
                className="text-amber-700 underline p-0 h-auto"
              >
                → Abgleichen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {incompleteBookings > 0 && (
          <Alert className="bg-white border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>{incompleteBookings}</strong> Buchung{incompleteBookings !== 1 ? 'en' : ''} zu bestätigen
              <Button
                variant="link"
                size="sm"
                onClick={() => window.location.href = createPageUrl('GeneratedBookings')}
                className="text-amber-700 underline p-0 h-auto"
              >
                → Bestätigen
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}