import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trackFeatureUsage } from '@/components/analytics/FeatureUsageTracker';

export default function BulkRentIncreaseDialog({ open, onOpenChange, buildingId, onSuccess }) {
  const [increasePercent, setIncreasePercent] = useState(3);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [affectedContracts, setAffectedContracts] = useState([]);
  const [previewMode, setPreviewMode] = useState(true);

  React.useEffect(() => {
    if (open && buildingId) {
      loadContracts();
    }
  }, [open, buildingId]);

  const loadContracts = async () => {
    try {
      const units = await base44.entities.Unit.filter({ gebaeude_id: buildingId });
      const unitIds = units.map(u => u.id);
      
      const allContracts = await base44.entities.LeaseContract.list();
      const activeContracts = allContracts.filter(c => 
        unitIds.includes(c.unit_id) && c.status === 'active'
      );
      
      setAffectedContracts(activeContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('Fehler beim Laden der Verträge');
    }
  };

  const handleBulkIncrease = async () => {
    if (!effectiveDate) {
      toast.error('Bitte wählen Sie ein Datum');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const total = affectedContracts.length;
      
      for (let i = 0; i < affectedContracts.length; i++) {
        const contract = affectedContracts[i];
        const currentRent = parseFloat(contract.base_rent) || 0;
        const newRent = currentRent * (1 + increasePercent / 100);

        // Create rent change record
        await base44.entities.RentChange.create({
          contract_id: contract.id,
          old_rent: currentRent,
          new_rent: newRent,
          increase_percentage: increasePercent,
          effective_date: effectiveDate,
          reason: `Batch-Erhöhung ${increasePercent}% (Gebäude-weit)`,
          status: 'approved'
        });

        // Update contract
        await base44.entities.LeaseContract.update(contract.id, {
          base_rent: newRent,
          total_rent: newRent + (parseFloat(contract.utilities) || 0) + (parseFloat(contract.heating) || 0)
        });

        setProgress(((i + 1) / total) * 100);
      }

      trackFeatureUsage.bulkOperationExecuted('rent_increase', total, true);
      toast.success(`${total} Verträge erhöht`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk rent increase error:', error);
      toast.error('Fehler bei der Mieterhöhung');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const totalIncrease = affectedContracts.reduce((sum, c) => {
    const current = parseFloat(c.base_rent) || 0;
    const newRent = current * (1 + increasePercent / 100);
    return sum + (newRent - current);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch-Mieterhöhung</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>{affectedContracts.length}</strong> aktive Verträge in diesem Gebäude
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Erhöhung (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={increasePercent}
                onChange={(e) => setIncreasePercent(parseFloat(e.target.value))}
                placeholder="3.0"
              />
            </div>
            <div>
              <Label>Wirksam ab *</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          </div>

          {increasePercent > 5 && (
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <p className="font-semibold">⚠️ Achtung: Kappungsgrenze</p>
                <p className="text-xs mt-1">
                  Erhöhungen über 5%/Jahr können gegen § 558 BGB verstoßen. Prüfen Sie jeden Vertrag einzeln.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Betroffene Verträge:</span>
              <span className="font-semibold">{affectedContracts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Durchschnittliche Erhöhung pro Vertrag:</span>
              <span className="font-semibold">€{affectedContracts.length > 0 ? (totalIncrease / affectedContracts.length).toFixed(2) : '0.00'}/Monat</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-slate-600">Gesamt-Mehreinnahmen:</span>
              <span className="font-bold text-emerald-600">€{totalIncrease.toFixed(2)}/Monat</span>
            </div>
          </div>

          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verarbeite Verträge...</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-slate-500">{Math.round(progress)}% abgeschlossen</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleBulkIncrease}
              disabled={processing || !effectiveDate}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Erhöhung durchführen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}