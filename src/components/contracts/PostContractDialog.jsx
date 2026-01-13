import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PostContractDialog({ open, onOpenChange, contract }) {
  if (!contract) return null;

  const steps = [
    {
      id: 'bookings',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Buchungen generieren (12 Monate)',
      description: 'Erstelle automatische SOLL-Buchungen für Mieteinnahmen',
      link: createPageUrl('LeaseContracts'),
      action: 'Jetzt generieren'
    },
    {
      id: 'document',
      icon: <FileText className="w-5 h-5" />,
      label: 'Mietvertrag-Dokument erstellen',
      description: 'Erstelle ein druckbares Mietvertrag-PDF',
      link: createPageUrl('Documents'),
      action: 'Dokument erstellen'
    },
    {
      id: 'deposit',
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Kaution als Zahlung erfassen',
      description: 'Erfasse die Kaution als geplante Einnahme',
      link: createPageUrl('Invoices'),
      action: 'Zur Kautionsverwaltung'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <DialogTitle>Mietvertrag erfolgreich erstellt! 🎉</DialogTitle>
              <DialogDescription>
                Für {contract.unit_number || 'diese Einheit'} mit Mietbeginn {new Date(contract.start_date).toLocaleDateString('de-DE')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <p className="text-sm text-slate-600 font-medium">Nächste Schritte:</p>
          
          {steps.map((step, idx) => (
            <Link key={step.id} to={step.link}>
              <Card className="hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 text-sm">{step.label}</h4>
                      <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Später erledigen
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Jetzt starten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}