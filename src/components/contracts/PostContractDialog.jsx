import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, FileText, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function PostContractDialog({
  open = false,
  contract = null,
  onClose,
  onGenerateBookings,
}) {
  const steps = [
    {
      id: 'bookings',
      icon: '📊',
      label: 'Buchungen generieren (12 Monate)',
      description: 'Erstellt automatische Mieteinnahmen',
      action: 'Jetzt generieren',
      color: 'bg-blue-50',
    },
    {
      id: 'document',
      icon: '📄',
      label: 'Mietvertrag-Dokument erstellen',
      description: 'Erzeugt ein druckfertiges PDF',
      action: 'Dokument erstellen',
      color: 'bg-purple-50',
    },
    {
      id: 'deposit',
      icon: '💰',
      label: 'Kaution als Zahlung erfassen',
      description: 'Optional: Kaution registrieren',
      action: 'Zur Kautionsverwaltung',
      color: 'bg-emerald-50',
    },
  ];

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <AlertDialogTitle>✅ Vertrag erfolgreich erstellt!</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Folgende Nächste Schritte werden empfohlen:
          </p>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-lg ${step.color} border border-opacity-30`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{step.label}</p>
                    <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                  </div>
                </div>

                {step.id === 'bookings' && (
                  <button
                    onClick={() => {
                      onGenerateBookings(contract);
                      onClose(false);
                    }}
                    className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors font-medium text-blue-700"
                  >
                    {step.action} →
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <AlertDialogCancel className="flex-1">Später erledigen</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onGenerateBookings(contract);
              onClose(false);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Jetzt Buchungen generieren
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}