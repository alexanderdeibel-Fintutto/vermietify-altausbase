import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PostContractDialog({ open, onOpenChange, contract }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <DialogTitle>Vertrag erfolgreich erstellt!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 my-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-600">Nächste Schritte:</p>
          </div>

          <div className="space-y-2">
            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <a href={createPageUrl('GeneratedBookings')}>
                <span>Buchungen generieren (12 Monate)</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <a href={createPageUrl('DocumentManagement')}>
                <span>Mietvertrag-Dokument erstellen</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <a href={createPageUrl('Invoices')}>
                <span>Kaution als Zahlung erfassen</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Später erledigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}