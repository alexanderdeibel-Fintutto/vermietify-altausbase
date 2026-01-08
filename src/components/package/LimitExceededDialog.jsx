import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LimitExceededDialog({ open, onOpenChange, type, remaining }) {
  const isBuilding = type === 'building';
  const title = isBuilding ? 'Objekt-Limit erreicht' : 'Wohneinheiten-Limit erreicht';
  const message = isBuilding
    ? `Du kannst keine weiteren Objekte hinzufügen. Dein Limit beträgt ${remaining} Objekt${remaining === 1 ? '' : 'e'}.`
    : `Du kannst keine weiteren Wohneinheiten hinzufügen. Dein Limit beträgt ${remaining} Wohneinheiten.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              Um mehr {isBuilding ? 'Objekte' : 'Wohneinheiten'} zu verwalten, musst du dein Paket upgraden.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-slate-900">Verfügbare Paket-Upgrades:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {isBuilding ? (
                <>
                  <li>• Easy Home: 1 Objekt</li>
                  <li>• Easy Vermieter: 1 Objekt (empfohlen)</li>
                  <li>• Easy Gewerbe: 5 Objekte</li>
                </>
              ) : (
                <>
                  <li>• Easy Home: 10 Wohneinheiten</li>
                  <li>• Easy Vermieter: 999 Wohneinheiten</li>
                  <li>• Easy Gewerbe: 999 Wohneinheiten</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Link to={createPageUrl('MyAccount')} className="flex-1">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Zum Paket-Manager
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}