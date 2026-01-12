import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActionRequiredWidget() {
  // Verträge ohne generierte Buchungen
  const { data: contractsWithoutBookings = [] } = useQuery({
    queryKey: ['contractsWithoutBookings'],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.list('-created_date', 100);
      const bookings = await base44.entities.PlannedBooking.list(null, 1000);
      
      const contractIds = new Set(bookings.map(b => b.contract_id));
      return contracts.filter(c => !contractIds.has(c.id)).slice(0, 10);
    }
  });

  // Rechnungen ohne Kategorie
  const { data: invoicesWithoutCategory = [] } = useQuery({
    queryKey: ['invoicesWithoutCategory'],
    queryFn: async () => {
      const invoices = await base44.entities.Invoice.list('-created_date', 100);
      return invoices.filter(i => !i.cost_category_id).slice(0, 10);
    }
  });

  // Bank-Transaktionen ohne Verknüpfung
  const { data: unlinkedTransactions = [] } = useQuery({
    queryKey: ['unlinkedTransactions'],
    queryFn: async () => {
      const transactions = await base44.entities.BankTransaction.list('-created_date', 100);
      return transactions.filter(t => !t.matched_financial_item_id && !t.matched_invoice_id).slice(0, 10);
    }
  });

  const issues = [
    {
      count: contractsWithoutBookings.length,
      label: 'Verträge ohne Buchungen',
      link: createPageUrl('GeneratedBookings'),
      icon: '📋'
    },
    {
      count: invoicesWithoutCategory.length,
      label: 'Rechnungen ohne Kategorie',
      link: createPageUrl('Invoices'),
      icon: '🏷️'
    },
    {
      count: unlinkedTransactions.length,
      label: 'Bank-Transaktionen ohne Verknüpfung',
      link: createPageUrl('BankAccounts'),
      icon: '🏦'
    }
  ];

  const totalIssues = issues.reduce((sum, i) => sum + i.count, 0);

  if (totalIssues === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg">⚠️ Handlungsbedarf</CardTitle>
          <Badge className="bg-orange-600 ml-auto">{totalIssues}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.map((issue, idx) => (
          issue.count > 0 && (
            <Link key={idx} to={issue.link}>
              <div className="flex items-center justify-between p-2 rounded hover:bg-orange-100 transition">
                <span className="text-sm">
                  {issue.icon} <span className="font-medium">{issue.count}x</span> {issue.label}
                </span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                  Beheben →
                </Button>
              </div>
            </Link>
          )
        ))}
      </CardContent>
    </Card>
  );
}