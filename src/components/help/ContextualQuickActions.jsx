import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, FileText, AlertTriangle, X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ContextualQuickActions({ context }) {
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-contextual'],
    queryFn: () => base44.entities.LeaseContract.list(),
    enabled: context.type === 'contract_detail'
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-contextual'],
    queryFn: () => base44.entities.Invoice.list(),
    enabled: context.type === 'building_detail'
  });

  useEffect(() => {
    analyzeContext();
  }, [context, contracts, invoices]);

  const analyzeContext = () => {
    const newSuggestions = [];

    // Contract expiring soon
    if (context.type === 'contract_detail' && context.contract) {
      const contract = context.contract;
      const endDate = contract.end_date ? new Date(contract.end_date) : null;
      const today = new Date();
      
      if (endDate) {
        const monthsUntilExpiry = (endDate - today) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsUntilExpiry <= 6 && monthsUntilExpiry > 0) {
          newSuggestions.push({
            id: 'rent-increase',
            icon: TrendingUp,
            title: 'Mieterhöhung vorschlagen',
            description: `Vertrag läuft in ${Math.round(monthsUntilExpiry)} Monaten aus`,
            color: 'emerald',
            action: () => {
              window.location.href = '#rent-increase-section';
            }
          });
        }

        if (monthsUntilExpiry <= 3 && monthsUntilExpiry > 0) {
          newSuggestions.push({
            id: 'contract-renewal',
            icon: FileText,
            title: 'Verlängerung vorbereiten',
            description: 'Erneuerungsangebot erstellen',
            color: 'blue',
            action: () => {
              window.location.href = '#renewal-section';
            }
          });
        }
      }
    }

    // Building with uncategorized invoices
    if (context.type === 'building_detail' && context.buildingId) {
      const uncategorized = invoices.filter(inv => 
        inv.building_id === context.buildingId && !inv.cost_type_id
      );

      if (uncategorized.length > 5) {
        newSuggestions.push({
          id: 'bulk-categorize',
          icon: Sparkles,
          title: 'Rechnungen kategorisieren',
          description: `${uncategorized.length} unkategorisierte Rechnungen`,
          color: 'purple',
          action: context.onBulkCategorize
        });
      }
    }

    // Contracts without bookings
    if (context.type === 'building_detail' && context.buildingId) {
      const contractsWithoutBookings = contracts.filter(async contract => {
        if (contract.building_id !== context.buildingId) return false;
        const items = await base44.entities.PlannedBooking.filter({ contract_id: contract.id });
        return items.length === 0;
      });

      if (contractsWithoutBookings.length > 0) {
        newSuggestions.push({
          id: 'bulk-bookings',
          icon: FileText,
          title: 'Buchungen generieren',
          description: `Für ${contractsWithoutBookings.length} Verträge`,
          color: 'indigo',
          action: context.onBulkBookings
        });
      }
    }

    setSuggestions(newSuggestions.filter(s => !dismissed.has(s.id)));
  };

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          const colorClasses = {
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            blue: 'bg-blue-50 border-blue-200 text-blue-900',
            purple: 'bg-purple-50 border-purple-200 text-purple-900',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900'
          };

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <Card className={`p-4 border-2 ${colorClasses[suggestion.color]} shadow-lg`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${suggestion.color}-100`}>
                    <Icon className={`w-5 h-5 text-${suggestion.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                    <p className="text-xs opacity-80 mb-3">{suggestion.description}</p>
                    <Button
                      size="sm"
                      onClick={suggestion.action}
                      className={`w-full bg-${suggestion.color}-600 hover:bg-${suggestion.color}-700`}
                    >
                      Jetzt durchführen
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}