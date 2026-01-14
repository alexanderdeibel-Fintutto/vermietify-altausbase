import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { FileText, Plus, RefreshCw, DollarSign } from 'lucide-react';

export default function ContextualQuickActions({ 
  context = 'invoice', 
  onAction 
}) {
  const actionsByContext = {
    invoice: [
      { 
        id: 'create_invoice', 
        label: 'Rechnung erfassen', 
        icon: FileText, 
        color: 'bg-blue-50 text-blue-700 border-blue-200' 
      },
      { 
        id: 'create_payment', 
        label: 'Zahlung erfassen', 
        icon: DollarSign, 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      }
    ],
    contract: [
      { 
        id: 'create_contract', 
        label: 'Vertrag anlegen', 
        icon: Plus, 
        color: 'bg-purple-50 text-purple-700 border-purple-200' 
      },
      { 
        id: 'generate_bookings', 
        label: 'Buchungen generieren', 
        icon: RefreshCw, 
        color: 'bg-blue-50 text-blue-700 border-blue-200' 
      }
    ],
    tenant: [
      { 
        id: 'create_tenant', 
        label: 'Mieter anlegen', 
        icon: Plus, 
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200' 
      }
    ]
  };

  const actions = actionsByContext[context] || [];

  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 flex-wrap"
    >
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(action.id)}
              className={`${action.color} border hover:opacity-80`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}