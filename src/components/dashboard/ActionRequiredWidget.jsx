import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function ActionRequiredWidget() {
  const [issues, setIssues] = useState({
    contractsWithoutBookings: 0,
    invoicesWithoutCategory: 0,
    transactionsWithoutLink: 0,
    contractsWithoutData: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        // Verträge ohne generierte Buchungen
        const contracts = await base44.entities.LeaseContract.list();
        const contractsWithoutBookings = contracts.filter(
          (c) => !c.booking_generation_status || c.booking_generation_status !== 'completed'
        ).length;

        // Rechnungen ohne Kategorie
        const invoices = await base44.entities.Invoice.list();
        const invoicesWithoutCategory = invoices.filter(
          (i) => !i.category || i.category === 'uncategorized'
        ).length;

        // Bank-Transaktionen ohne Verknüpfung
        const transactions = await base44.entities.BankTransaction.list();
        const transactionsWithoutLink = transactions.filter(
          (t) => !t.linked_entity_id || t.linked_entity_id === ''
        ).length;

        // Verträge mit fehlenden Daten
        const contractsWithoutData = contracts.filter(
          (c) => !c.start_date || !c.tenant_id
        ).length;

        setIssues({
          contractsWithoutBookings,
          invoicesWithoutCategory,
          transactionsWithoutLink,
          contractsWithoutData,
        });
      } catch (error) {
        console.error('Error fetching action items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const totalIssues =
    issues.contractsWithoutBookings +
    issues.invoicesWithoutCategory +
    issues.transactionsWithoutLink +
    issues.contractsWithoutData;

  if (loading || totalIssues === 0) {
    return null;
  }

  const actionItems = [
    {
      count: issues.contractsWithoutBookings,
      label: 'Verträge ohne generierte Buchungen',
      description: 'Mieteinnahmen fehlen in der Finanzübersicht',
      icon: '📋',
      color: 'from-blue-50 to-blue-100',
      page: 'Contracts',
    },
    {
      count: issues.invoicesWithoutCategory,
      label: 'Rechnungen ohne Kategorie',
      description: 'Nicht kategorisiert → fehlen in BK-Abrechnung',
      icon: '📄',
      color: 'from-amber-50 to-amber-100',
      page: 'Invoices',
    },
    {
      count: issues.transactionsWithoutLink,
      label: 'Bank-Transaktionen ohne Verknüpfung',
      description: 'Zahlungen nicht zugeordnet',
      icon: '🏦',
      color: 'from-slate-50 to-slate-100',
      page: 'BankTransactions',
    },
    {
      count: issues.contractsWithoutData,
      label: 'Verträge mit fehlenden Daten',
      description: 'Pflichtfelder nicht ausgefüllt',
      icon: '⚠️',
      color: 'from-red-50 to-red-100',
      page: 'Contracts',
    },
  ].filter((item) => item.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">
              ⚠️ {totalIssues} Handlungsschritte erforderlich
            </h3>
            <p className="text-xs text-amber-800">Bitte beachten Sie diese Punkte</p>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-2">
          {actionItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg bg-gradient-to-r ${item.color} border border-opacity-30`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {item.icon} {item.label}
                  </p>
                  <p className="text-xs text-slate-700 mt-0.5">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white font-bold text-xs text-slate-900">
                    {item.count}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => (window.location.href = createPageUrl(item.page))}
                    className="h-7 p-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-700 pt-2 border-t border-amber-200">
          💡 Tipp: Erledigen Sie diese Aufgaben, um Ihre Finanzübersicht genauer zu machen.
        </p>
      </Card>
    </motion.div>
  );
}