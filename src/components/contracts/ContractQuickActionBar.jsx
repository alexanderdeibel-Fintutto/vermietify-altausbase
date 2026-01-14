import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Euro, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContractQuickActionBar({ 
  contract, 
  onGenerateBookings, 
  onGenerateDocument,
  onTenantChange,
  onRecordPayment 
}) {
  const actions = [
    {
      id: 'bookings',
      icon: RefreshCw,
      label: 'Buchungen generieren',
      description: '12 Monate Mieteinnahmen',
      variant: 'default',
      onClick: onGenerateBookings,
    },
    {
      id: 'document',
      icon: FileText,
      label: 'Vertragsdokument',
      description: 'PDF erstellen',
      variant: 'outline',
      onClick: onGenerateDocument,
    },
    {
      id: 'payment',
      icon: Euro,
      label: 'Zahlung erfassen',
      description: 'Miete/Kaution buchen',
      variant: 'outline',
      onClick: onRecordPayment,
    },
    {
      id: 'tenant_change',
      icon: Users,
      label: 'Mieterwechsel',
      description: 'Wechsel-Wizard starten',
      variant: 'outline',
      onClick: onTenantChange,
    },
  ];

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">Schnellaktionen</p>
            <p className="text-xs text-blue-700">Was möchten Sie als Nächstes tun?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Button
                  variant={action.variant}
                  onClick={action.onClick}
                  className="w-full h-auto flex-col items-start p-3 gap-1"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{action.label}</span>
                  <span className="text-xs opacity-70">{action.description}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}