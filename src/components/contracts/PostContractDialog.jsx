import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PostContractDialog({ open, onOpenChange, contractId }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <DialogTitle>✅ Vertrag erfolgreich erstellt!</DialogTitle>
          </div>
          <DialogDescription>Nächste Schritte für vollständige Einrichtung</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          {/* Buchungen generieren */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" className="mt-1" disabled />
            <div className="flex-1">
              <p className="text-sm font-medium">Buchungen generieren (12 Monate)</p>
              <p className="text-xs text-slate-600 mt-1">Erstellt automatische SOLL-Buchungen für Mieteinnahmen</p>
            </div>
            <Link to={createPageUrl('GeneratedBookings')}>
              <Button size="sm" variant="outline" className="text-xs">
                Jetzt generieren
              </Button>
            </Link>
          </div>

          {/* Mietvertrag-Dokument */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" className="mt-1" disabled />
            <div className="flex-1">
              <p className="text-sm font-medium">Mietvertrag-Dokument erstellen</p>
              <p className="text-xs text-slate-600 mt-1">Generiert ein ausgefülltes PDF zum Ausdrucken</p>
            </div>
            <Button size="sm" variant="outline" className="text-xs" disabled>
              Später
            </Button>
          </div>

          {/* Kaution */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" className="mt-1" disabled />
            <div className="flex-1">
              <p className="text-sm font-medium">Kaution als Zahlung erfassen</p>
              <p className="text-xs text-slate-600 mt-1">Falls Kaution schon gezahlt wurde</p>
            </div>
            <Link to={createPageUrl('BankAccounts')}>
              <Button size="sm" variant="outline" className="text-xs">
                Kaution
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Später erledigen
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => onOpenChange(false)}>
            Weiterarbeiten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}