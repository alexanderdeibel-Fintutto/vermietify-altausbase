import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function UpgradeDialog({ open, onOpenChange, addon, onConfirm }) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm?.();
    } finally {
      setLoading(false);
    }
  };

  if (!addon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade zu {addon.name}</DialogTitle>
          <DialogDescription>
            {addon.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Monatliche Gebühr</p>
            <p className="text-2xl font-bold">€{addon.price}/Monat</p>
          </div>

          {addon.features && (
            <div>
              <p className="font-medium text-sm mb-2">Enthaltene Features:</p>
              <ul className="space-y-1">
                {addon.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex gap-2">
                    <span>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              'Jetzt upgraden'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}