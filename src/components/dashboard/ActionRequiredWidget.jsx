import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function ActionRequiredWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract?.list?.() || []
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice?.list?.() || []
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.PlannedBooking?.list?.() || []
  });

  const contractsWithoutBookings = contracts.filter(c => 
    !bookings.some(b => b.lease_contract_id === c.id && b.type === 'rent_income')
  ).length;

  const uncategorizedInvoices = invoices.filter(inv => !inv.cost_type_id).length;
  
  const unmatchedTransactions = 0; // TODO: Count from bank transactions

  const issues = [
    { count: contractsWithoutBookings, label: 'Verträge ohne Buchungen', page: 'Contracts', severity: 'high' },
    { count: uncategorizedInvoices, label: 'Rechnungen ohne Kategorie', page: 'Invoices', severity: 'high' },
    { count: unmatchedTransactions, label: 'Bank-Zahlungen ohne Zuordnung', page: 'BankTransactions', severity: 'medium' }
  ];

  const totalIssues = issues.reduce((sum, i) => sum + i.count, 0);
  
  if (totalIssues === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-base">⚠️ Handlungsbedarf ({totalIssues})</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {issues.filter(i => i.count > 0).map((issue, idx) => (
          <Link key={idx} to={createPageUrl(issue.page)}>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-orange-50 transition">
              <div>
                <p className="text-sm font-medium text-slate-900">{issue.label}</p>
                <Badge 
                  className={issue.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                >
                  {issue.count} {issue.count === 1 ? 'Item' : 'Items'}
                </Badge>
              </div>
              <Button size="sm" variant="outline">→</Button>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}