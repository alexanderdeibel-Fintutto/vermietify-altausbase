import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ActionRequiredWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract?.list?.() || [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice?.list?.() || [],
  });

  const { data: bankTransactions = [] } = useQuery({
    queryKey: ['bankTransactions'],
    queryFn: () => base44.entities.BankTransaction?.list?.() || [],
  });

  // Count issues
  const contractsWithoutBookings = contracts.filter(c => !c.bookings_generated).length;
  const invoicesWithoutCategory = invoices.filter(i => !i.cost_category_id && !i.cost_type_id).length;
  const unmatchedTransactions = bankTransactions.filter(b => !b.matched_invoice_id).length;
  const contractsWithoutRequiredFields = contracts.filter(c => {
    return c.status === 'active' && (!c.start_date || !c.total_rent);
  }).length;

  const totalIssues = contractsWithoutBookings + invoicesWithoutCategory + unmatchedTransactions + contractsWithoutRequiredFields;

  if (totalIssues === 0) return null;

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <AlertTriangle className="w-5 h-5" />
          ⚠️ Handlungsbedarf ({totalIssues})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {contractsWithoutBookings > 0 && (
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span>{contractsWithoutBookings} Verträge ohne generierte Buchungen</span>
            <Link to={createPageUrl('GeneratedBookings')}>
              <Button size="sm" variant="outline" className="h-7">
                Jetzt generieren
              </Button>
            </Link>
          </div>
        )}
        {invoicesWithoutCategory > 0 && (
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span>{invoicesWithoutCategory} Rechnungen ohne Kategorie</span>
            <Link to={createPageUrl('Invoices')}>
              <Button size="sm" variant="outline" className="h-7">
                Kategorisieren
              </Button>
            </Link>
          </div>
        )}
        {unmatchedTransactions > 0 && (
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span>{unmatchedTransactions} Bank-Transaktionen unverknüpft</span>
            <Link to={createPageUrl('BankReconciliation')}>
              <Button size="sm" variant="outline" className="h-7">
                Verknüpfen
              </Button>
            </Link>
          </div>
        )}
        {contractsWithoutRequiredFields > 0 && (
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span>{contractsWithoutRequiredFields} Verträge mit fehlenden Feldern</span>
            <Link to={createPageUrl('LeaseContracts')}>
              <Button size="sm" variant="outline" className="h-7">
                Prüfen
              </Button>
            </Link>
          </div>
        )}
        </CardContent>
        </Card>
        );
        }