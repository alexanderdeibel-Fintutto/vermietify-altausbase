import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Send, Copy, Trash2, Download, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

const actionConfigs = {
  invoice: [
    { icon: Send, label: 'Versenden', action: 'send', variant: 'default' },
    { icon: Copy, label: 'Duplizieren', action: 'duplicate', variant: 'outline' },
    { icon: Download, label: 'Download', action: 'download', variant: 'outline' },
  ],
  contract: [
    { icon: FileText, label: 'PDF erzeugen', action: 'pdf', variant: 'default' },
    { icon: Send, label: 'Versenden', action: 'send', variant: 'outline' },
    { icon: Edit, label: 'Bearbeiten', action: 'edit', variant: 'outline' },
  ],
  tenant: [
    { icon: Send, label: 'Nachricht', action: 'message', variant: 'default' },
    { icon: FileText, label: 'Dokumente', action: 'documents', variant: 'outline' },
  ]
};

export default function ContextualQuickActions({ 
  entityType, 
  entity,
  onAction 
}) {
  const actions = actionConfigs[entityType] || [];

  if (actions.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <div className="p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">
          Schnellaktionen
        </h3>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Button
                  variant={action.variant}
                  size="sm"
                  onClick={() => onAction?.(action.action, entity)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}