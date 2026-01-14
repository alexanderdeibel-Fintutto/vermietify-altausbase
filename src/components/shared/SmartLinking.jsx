import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, ExternalLink, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function SmartLinking({ 
  entity,
  entityType,
  onLink 
}) {
  const [suggestions, setSuggestions] = useState([]);

  // Find related entities based on smart matching
  const { data: relatedContracts } = useQuery({
    queryKey: ['relatedContracts', entity?.unit_id],
    queryFn: async () => {
      if (!entity?.unit_id || entityType === 'contract') return [];
      const contracts = await base44.entities.LeaseContract.filter({ 
        unit_id: entity.unit_id 
      });
      return contracts.slice(0, 3);
    },
    enabled: !!entity?.unit_id
  });

  const { data: relatedInvoices } = useQuery({
    queryKey: ['relatedInvoices', entity?.recipient_id],
    queryFn: async () => {
      if (!entity?.recipient_id || entityType === 'invoice') return [];
      const invoices = await base44.entities.Invoice.filter({ 
        recipient_id: entity.recipient_id 
      });
      return invoices.slice(0, 3);
    },
    enabled: !!entity?.recipient_id
  });

  useEffect(() => {
    const allSuggestions = [];

    if (relatedContracts?.length > 0) {
      allSuggestions.push({
        type: 'contract',
        icon: Calendar,
        label: 'Verträge',
        items: relatedContracts,
        color: 'purple'
      });
    }

    if (relatedInvoices?.length > 0) {
      allSuggestions.push({
        type: 'invoice',
        icon: TrendingUp,
        label: 'Rechnungen',
        items: relatedInvoices,
        color: 'blue'
      });
    }

    setSuggestions(allSuggestions);
  }, [relatedContracts, relatedInvoices]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
          <Link2 className="w-4 h-4" />
          Verwandte Einträge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, idx) => {
          const Icon = suggestion.icon;
          return (
            <motion.div
              key={suggestion.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 text-${suggestion.color}-600`} />
                <span className="text-sm font-medium text-slate-700">
                  {suggestion.label}
                </span>
                <Badge variant="outline" className="ml-auto">
                  {suggestion.items.length}
                </Badge>
              </div>

              <div className="space-y-1">
                {suggestion.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onLink?.(suggestion.type, item)}
                    className="w-full text-left p-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">
                        {item.tenant_name || item.description || item.name || item.id}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    {item.rent && (
                      <span className="text-xs text-slate-500">
                        €{item.rent.toFixed(2)}/Monat
                      </span>
                    )}
                    {item.amount && (
                      <span className="text-xs text-slate-500">
                        €{item.amount.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}