import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PostContractDialog({ open, onOpenChange, contract }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <DialogTitle>Mietvertrag erfolgreich erstellt! ✅</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Der Mietvertrag für <strong>{contract?.unit_name}</strong> wurde erstellt. Folgende Schritte sind empfohlen:
          </p>

          <div className="space-y-2">
            {/* Step 1: Generate Bookings */}
            <div className="p-3 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="flex items-start gap-3">
                <input type="checkbox" defaultChecked className="mt-1" disabled />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Buchungen generieren</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Erstellt automatische SOLL-Mieteinnahmen für 12 Monate
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = createPageUrl('GeneratedBookings');
                  onOpenChange(false);
                }}
                className="mt-2 text-xs gap-1"
              >
                Jetzt generieren
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            {/* Step 2: Create Document */}
            <div className="p-3 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" disabled />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Mietvertrag-Dokument erstellen</p>
                  <p className="text-xs text-slate-600 mt-1">
                    PDF generieren und drucken/versenden
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = createPageUrl('DocumentManagement');
                  onOpenChange(false);
                }}
                className="mt-2 text-xs gap-1"
              >
                Dokument erstellen
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            {/* Step 3: Record Deposit */}
            <div className="p-3 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" disabled />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Kaution erfassen</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Kautions-Zahlung als Einnahme buchen (optional)
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = createPageUrl('Invoices');
                  onOpenChange(false);
                }}
                className="mt-2 text-xs gap-1"
              >
                Zur Zahlungsverwaltung
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 <strong>Tipp:</strong> Du kannst diese Schritte auch später erledigen. Sie sind über das Vertrag-Menü jederzeit erreichbar.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Später erledigen
          </Button>
          <Button
            onClick={() => {
              window.location.href = createPageUrl('GeneratedBookings');
              onOpenChange(false);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Jetzt weitermachen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}