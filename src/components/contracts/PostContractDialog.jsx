import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PostContractDialog({ open, onOpenChange, contract }) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <DialogTitle>✅ Mietvertrag erfolgreich erstellt!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Dein Mietvertrag für <strong>{contract.unit_id}</strong> ab <strong>{contract.start_date}</strong> wurde erstellt.
          </p>

          <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-3">📋 Nächste Schritte:</p>
            
            <div className="space-y-2">
              <Link to={createPageUrl('GeneratedBookings')}>
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Buchungen generieren</p>
                    <p className="text-xs text-slate-500">Erstelle automatische SOLL-Buchungen für 12 Monate</p>
                  </div>
                </Button>
              </Link>

              <Link to={createPageUrl('DocumentGeneration')}>
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Mietvertrag-Dokument</p>
                    <p className="text-xs text-slate-500">Generiere ein druckbares Vertragsdokument</p>
                  </div>
                </Button>
              </Link>

              <Link to={createPageUrl('Invoices')}>
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <Banknote className="w-4 h-4 mr-2 text-orange-600" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Kaution erfassen</p>
                    <p className="text-xs text-slate-500">Erfasse die Kautionszahlung als Einnahme</p>
                  </div>
                </Button>
              </Link>
            </div>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full bg-blue-600">
            Später erledigen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}