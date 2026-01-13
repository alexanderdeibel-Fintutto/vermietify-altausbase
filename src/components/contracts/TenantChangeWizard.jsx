import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

export default function TenantChangeWizard({ open, onOpenChange, unitId }) {
  const [step, setStep] = useState(1);
  const [oldTenant, setOldTenant] = useState('');
  const [newTenant, setNewTenant] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [terminationValidation, setTerminationValidation] = useState(null);
  const queryClient = useQueryClient();
  
  const validateTerminationDate = async (date) => {
    if (!date || !unitId) return;
    try {
      const contracts = await base44.entities.LeaseContract.filter({ unit_id: unitId, status: 'active' });
      if (contracts.length > 0) {
        const result = await base44.functions.invoke('calculateKuendigungsfrist', {
          contract_id: contracts[0].id,
          termination_date: date
        });
        setTerminationValidation(result.data);
      }
    } catch (error) {
      console.error('Validierungsfehler:', error);
    }
  };

  const processMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('processTenantChange', {
        unit_id: unitId,
        old_tenant: oldTenant,
        new_tenant: newTenant,
        move_out_date: moveOutDate,
        move_in_date: moveInDate
      });
    },
    onSuccess: () => {
      toast.success('Mieterwechsel verarbeitet');
      queryClient.invalidateQueries({ queryKey: ['units', 'contracts'] });
      setStep(3);
    },
    onError: () => {
      toast.error('Fehler beim Mieterwechsel');
    }
  });

  const handleReset = () => {
    setStep(1);
    setOldTenant('');
    setNewTenant('');
    setMoveOutDate('');
    setMoveInDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>👥 Mieterwechsel</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Automatische Schritte:</p>
                <ul className="text-xs mt-1 space-y-1">
                  <li>✓ Alten Vertrag beenden</li>
                  <li>✓ Neuen Vertrag erstellen (Vorlage)</li>
                  <li>✓ Mieterwechsel-Dokument</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Alter Mieter</Label>
                <Input 
                  placeholder="Name des ausziehenden Mieters"
                  value={oldTenant}
                  onChange={(e) => setOldTenant(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Auszugsdatum</Label>
                <Input 
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => {
                    setMoveOutDate(e.target.value);
                    validateTerminationDate(e.target.value);
                  }}
                />
                {terminationValidation && !terminationValidation.is_valid && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-900 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Kündigungsfrist nicht eingehalten. Frühestens: {terminationValidation.earliest_termination}</span>
                  </div>
                )}
                {terminationValidation?.is_valid && (
                  <Badge className="mt-2 bg-green-100 text-green-700">✓ Kündigungsfrist eingehalten</Badge>
                )}
              </div>

              <div>
                <Label className="text-xs">Neuer Mieter</Label>
                <Input 
                  placeholder="Name des neuen Mieters"
                  value={newTenant}
                  onChange={(e) => setNewTenant(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Einzugsdatum</Label>
                <Input 
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button 
                onClick={() => processMutation.mutate()}
                disabled={!oldTenant || !newTenant || !moveOutDate || !moveInDate || processMutation.isPending}
                className="flex-1 bg-blue-600"
              >
                Verarbeiten
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <p className="font-medium">✅ Mieterwechsel abgeschlossen!</p>
              <p className="text-sm text-slate-600 mt-1">
                {oldTenant} → {newTenant}
              </p>
            </div>
            <Button onClick={handleReset} className="w-full bg-emerald-600">
              Fertig
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}