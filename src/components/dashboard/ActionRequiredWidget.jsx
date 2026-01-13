import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActionRequiredWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contractsWithoutBookings'],
    queryFn: async () => {
      const allContracts = await base44.entities.LeaseContract.list('-start_date', 100);
      // Filter contracts without generated bookings (simplified - would need actual booking check)
      return allContracts.filter(c => c.status === 'active');
    }
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['uncategorizedInvoices'],
    queryFn: async () => {
      const allInvoices = await base44.entities.Invoice.list('-created_date', 100);
      return allInvoices.filter(i => !i.cost_category_id);
    }
  });

  const { data: bankTransactions = [] } = useQuery({
    queryKey: ['unmatchedTransactions'],
    queryFn: async () => {
      const allTransactions = await base44.entities.BankTransaction.list('-transaction_date', 100);
      return allTransactions.filter(t => !t.matched_booking_id);
    }
  });

  const issues = [
    { count: contracts.length, label: 'Verträge ohne Buchungen', link: createPageUrl('LeaseContracts'), icon: '📄' },
    { count: invoices.length, label: 'Rechnungen ohne Kategorie', link: createPageUrl('Invoices'), icon: '🏷️' },
    { count: bankTransactions.length, label: 'Bank-Transaktionen unverknüpft', link: createPageUrl('BankReconciliation'), icon: '🔗' },
  ];

  const totalIssues = issues.reduce((sum, i) => sum + i.count, 0);

  if (totalIssues === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <CardTitle>⚠️ Handlungsbedarf ({totalIssues})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.map((issue, idx) => (
          issue.count > 0 && (
            <Link key={idx} to={issue.link}>
              <Button 
                variant="ghost" 
                className="w-full justify-between text-left h-auto py-2 hover:bg-red-100"
              >
                <span>
                  <span className="font-semibold text-red-700">{issue.count}</span>
                  <span className="text-red-600"> {issue.label}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-red-600" />
              </Button>
            </Link>
          )
        ))}
      </CardContent>
    </Card>
  );
}