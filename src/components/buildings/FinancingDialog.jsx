import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export default function FinancingDialog({ open, onClose, buildingId, financing }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    building_id: buildingId,
    kreditgeber: '',
    darlehensnummer: '',
    darlehensart: 'Annuitätendarlehen',
    darlehensbetrag: '',
    auszahlungsdatum: '',
    zinssatz_nominal: '',
    zinssatz_effektiv: '',
    zinsbindung_bis: '',
    tilgung_anfangs: '',
    rate_monatlich: '',
    sondertilgung_erlaubt: '',
    restschuld_aktuell: '',
    iban_abzug: '',
    status: 'Aktiv',
    bemerkungen: ''
  });

  useEffect(() => {
    if (financing) {
      setFormData(financing);
    }
  }, [financing]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (financing?.id) {
        return base44.entities.Financing.update(financing.id, data);
      }
      return base44.entities.Financing.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['financings', buildingId]);
      toast.success('Finanzierung gespeichert');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.zinssatz_nominal) > 15) {
      toast.error('Zinssatz erscheint unrealistisch hoch!');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{financing ? 'Finanzierung bearbeiten' : 'Finanzierung hinzufügen'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kreditgeber *</Label>
              <Input
                value={formData.kreditgeber}
                onChange={e => setFormData({...formData, kreditgeber: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Darlehensnummer</Label>
              <Input
                value={formData.darlehensnummer}
                onChange={e => setFormData({...formData, darlehensnummer: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Darlehensart *</Label>
              <Select value={formData.darlehensart} onValueChange={v => setFormData({...formData, darlehensart: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annuitätendarlehen">Annuitätendarlehen</SelectItem>
                  <SelectItem value="Endfälliges Darlehen">Endfälliges Darlehen</SelectItem>
                  <SelectItem value="Tilgungsdarlehen">Tilgungsdarlehen</SelectItem>
                  <SelectItem value="KfW-Darlehen">KfW-Darlehen</SelectItem>
                  <SelectItem value="Bauspardarlehen">Bauspardarlehen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktiv">Aktiv</SelectItem>
                  <SelectItem value="Abgelöst">Abgelöst</SelectItem>
                  <SelectItem value="Pausiert">Pausiert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Darlehensbetrag *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.darlehensbetrag}
                onChange={e => setFormData({...formData, darlehensbetrag: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Auszahlungsdatum *</Label>
              <Input
                type="date"
                value={formData.auszahlungsdatum}
                onChange={e => setFormData({...formData, auszahlungsdatum: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Zinssatz nominal (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.zinssatz_nominal}
                onChange={e => setFormData({...formData, zinssatz_nominal: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Zinssatz effektiv (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.zinssatz_effektiv}
                onChange={e => setFormData({...formData, zinssatz_effektiv: e.target.value})}
              />
            </div>
            <div>
              <Label>Tilgung anfangs (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.tilgung_anfangs}
                onChange={e => setFormData({...formData, tilgung_anfangs: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Zinsbindung bis *</Label>
              <Input
                type="date"
                value={formData.zinsbindung_bis}
                onChange={e => setFormData({...formData, zinsbindung_bis: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Monatliche Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.rate_monatlich}
                onChange={e => setFormData({...formData, rate_monatlich: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sondertilgung erlaubt (pro Jahr)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.sondertilgung_erlaubt}
                onChange={e => setFormData({...formData, sondertilgung_erlaubt: e.target.value})}
              />
            </div>
            <div>
              <Label>Restschuld aktuell</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.restschuld_aktuell}
                onChange={e => setFormData({...formData, restschuld_aktuell: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>IBAN für Einzug</Label>
            <Input
              value={formData.iban_abzug}
              onChange={e => setFormData({...formData, iban_abzug: e.target.value})}
            />
          </div>

          <div>
            <Label>Bemerkungen</Label>
            <Textarea
              value={formData.bemerkungen}
              onChange={e => setFormData({...formData, bemerkungen: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}