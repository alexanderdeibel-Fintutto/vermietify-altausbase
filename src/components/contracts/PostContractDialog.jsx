import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, FileText, Wallet, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function PostContractDialog({ open, onClose, contract, onGenerateBookings }) {
  const [tasks, setTasks] = useState({
    bookings: false,
    document: false,
    deposit: false
  });

  const nextSteps = [
    {
      key: 'bookings',
      icon: Calendar,
      title: 'Buchungen generieren',
      description: `${contract?.duration_months || 12} Monate Mieteinnahmen (SOLL) erstellen`,
      action: onGenerateBookings,
      actionLabel: 'Jetzt generieren',
      primary: true
    },
    {
      key: 'document',
      icon: FileText,
      title: 'Mietvertrag-Dokument erstellen',
      description: 'Vertragsdokument für Unterschrift generieren',
      link: createPageUrl('DocumentGeneration'),
      actionLabel: 'Dokument erstellen'
    },
    {
      key: 'deposit',
      icon: Wallet,
      title: 'Kaution erfassen',
      description: 'Kautionszahlung als Transaktion erfassen',
      link: createPageUrl('BankTransactions'),
      actionLabel: 'Zur Kautionsverwaltung'
    }
  ];

  const handleComplete = () => {
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-6 h-6" />
            Vertrag erfolgreich erstellt!
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-slate-600">
            Der Mietvertrag wurde gespeichert. Hier sind die empfohlenen nächsten Schritte:
          </p>

          <div className="space-y-3">
            {nextSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-slate-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={tasks[step.key]}
                      onCheckedChange={(checked) => 
                        setTasks(prev => ({ ...prev, [step.key]: checked }))
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-900">{step.title}</span>
                        {step.primary && (
                          <Badge variant="default" className="bg-blue-600 text-xs">
                            Empfohlen
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </div>
                    {step.action ? (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          step.action?.();
                          setTasks(prev => ({ ...prev, [step.key]: true }));
                        }}
                        className={step.primary ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {step.actionLabel}
                      </Button>
                    ) : step.link ? (
                      <Link to={step.link}>
                        <Button size="sm" variant="outline">
                          {step.actionLabel}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleComplete} variant="outline">
            Später erledigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}