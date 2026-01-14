import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, CreditCard, Link as LinkIcon, FileX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function ActionRequiredWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list('-created_date', 100)
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice?.list?.('-created_date', 100) || []
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['bankTransactions'],
    queryFn: () => base44.entities.BankTransaction?.list?.('-created_date', 100) || []
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financialItems'],
    queryFn: () => base44.entities.FinancialItem?.list?.('-created_date', 100) || []
  });

  // Verträge ohne generierte Buchungen
  const contractsWithoutBookings = contracts.filter(contract => {
    const hasBookings = financialItems.some(item => 
      item.source_id === contract.id && item.source_type === 'LeaseContract'
    );
    return contract.status === 'active' && !hasBookings;
  });

  // Rechnungen ohne Kategorie
  const uncategorizedInvoices = invoices.filter(inv => 
    !inv.cost_type_id || inv.cost_type_id === ''
  );

  // Bank-Transaktionen ohne Verknüpfung
  const unmatchedTransactions = transactions.filter(trans => 
    !trans.invoice_id && !trans.contract_id
  );

  // Verträge mit fehlenden Pflichtdaten
  const incompleteContracts = contracts.filter(contract => 
    !contract.monthly_rent || !contract.start_date || !contract.tenant_id
  );

  const totalIssues = 
    contractsWithoutBookings.length +
    uncategorizedInvoices.length +
    unmatchedTransactions.length +
    incompleteContracts.length;

  if (totalIssues === 0) {
    return null;
  }

  const issues = [
    {
      count: contractsWithoutBookings.length,
      label: 'Verträge ohne Buchungen',
      description: 'Mieteinnahmen fehlen in der Finanzübersicht',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: createPageUrl('Contracts'),
      action: 'Buchungen generieren'
    },
    {
      count: uncategorizedInvoices.length,
      label: 'Rechnungen ohne Kategorie',
      description: 'Werden in BK-Abrechnungen/Anlage V nicht berücksichtigt',
      icon: FileX,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: createPageUrl('Invoices'),
      action: 'Kategorisieren'
    },
    {
      count: unmatchedTransactions.length,
      label: 'Bank-Transaktionen ohne Verknüpfung',
      description: 'Müssen mit Rechnungen verknüpft werden',
      icon: LinkIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: createPageUrl('BankTransactions'),
      action: 'Verknüpfen'
    },
    {
      count: incompleteContracts.length,
      label: 'Verträge mit fehlenden Daten',
      description: 'Pflichtfelder nicht ausgefüllt',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: createPageUrl('Contracts'),
      action: 'Vervollständigen'
    }
  ].filter(issue => issue.count > 0);

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertCircle className="w-5 h-5" />
          ⚠️ Handlungsbedarf ({totalIssues})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {issues.map((issue, idx) => {
            const Icon = issue.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`${issue.bgColor} rounded-lg p-4 border border-${issue.color.split('-')[1]}-200`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 ${issue.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{issue.count}</span>
                          <span className="text-sm text-slate-700">{issue.label}</span>
                        </div>
                        <p className="text-xs text-slate-600">{issue.description}</p>
                      </div>
                    </div>
                    <Link to={issue.link}>
                      <Button size="sm" variant="outline">
                        {issue.action}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}