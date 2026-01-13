import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ActionRequiredWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => base44.entities.LeaseContract?.list?.('-created_date', 100) || []
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => base44.entities.Invoice?.list?.('-created_date', 100) || []
  });

  const { data: bankTx = [] } = useQuery({
    queryKey: ['bank-transactions'],
    queryFn: async () => base44.entities.BankTransaction?.list?.('-created_date', 100) || []
  });

  // Count items without generated bookings
  const contractsNoBookings = contracts.filter(c => !c.bookings_generated).length;
  const invoicesNoCategory = invoices.filter(i => !i.category).length;
  const bankTxNoLink = bankTx.filter(b => !b.matched_invoice_id).length;

  const issues = [
    { label: 'Verträge ohne Buchungen', count: contractsNoBookings, color: 'bg-red-100 text-red-800' },
    { label: 'Rechnungen ohne Kategorie', count: invoicesNoCategory, color: 'bg-orange-100 text-orange-800' },
    { label: 'Bank-Transaktionen unverknüpft', count: bankTxNoLink, color: 'bg-yellow-100 text-yellow-800' }
  ];

  const totalIssues = issues.reduce((sum, i) => sum + i.count, 0);

  if (totalIssues === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-sm">⚠️ Handlungsbedarf ({totalIssues})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {issues.map(issue => (
            issue.count > 0 && (
              <div key={issue.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-700">{issue.label}</span>
                <Badge className={issue.color}>{issue.count}</Badge>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}