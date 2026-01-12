import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OtherAssetFormDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    asset_type: 'KUNSTWERK',
    name: '',
    description: '',
    acquisition_date: '',
    acquisition_cost: '',
    current_value: '',
    valuation_source: 'SELBSTEINSCHAETZUNG',
    currency: 'EUR',
    company_name: '',
    ownership_percentage: '',
    tax_treatment: 'PRIVATES_VERAEUSSERUNGSGESCHAEFT',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : null,
      current_value: formData.current_value ? parseFloat(formData.current_value) : null,
      ownership_percentage: formData.ownership_percentage ? parseFloat(formData.ownership_percentage) : null,
      valuation_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sonstigen Vermögenswert hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset_type">Typ *</Label>
              <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KUNSTWERK">Kunstwerk</SelectItem>
                  <SelectItem value="SAMMLUNG">Sammlung</SelectItem>
                  <SelectItem value="GMBH_ANTEIL">GmbH-Anteil</SelectItem>
                  <SelectItem value="KOMMANDITANTEIL">Kommanditanteil</SelectItem>
                  <SelectItem value="STILLE_BETEILIGUNG">Stille Beteiligung</SelectItem>
                  <SelectItem value="DARLEHEN_GEGEBEN">Darlehen gegeben</SelectItem>
                  <SelectItem value="SONSTIGES">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Gemälde, Kunstfond-Anteil"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              placeholder="Ausführliche Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acquisition_date">Erwerbsdatum</Label>
              <Input
                id="acquisition_date"
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="acquisition_cost">Anschaffungskosten (EUR)</Label>
              <Input
                id="acquisition_cost"
                type="number"
                step="0.01"
                placeholder="z.B. 5000"
                value={formData.acquisition_cost}
                onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_value">Aktueller Wert (EUR)</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                placeholder="z.B. 7500"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="valuation_source">Bewertungsquelle</Label>
              <Select value={formData.valuation_source} onValueChange={(v) => setFormData({ ...formData, valuation_source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUTACHTEN">Gutachten</SelectItem>
                  <SelectItem value="SELBSTEINSCHAETZUNG">Selbsteinschätzung</SelectItem>
                  <SelectItem value="MARKTPREIS">Marktpreis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.asset_type.includes('ANTEIL') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Firmenname</Label>
                <Input
                  id="company_name"
                  placeholder="z.B. Musterfirma GmbH"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ownership_percentage">Anteil (%)</Label>
                <Input
                  id="ownership_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="z.B. 25"
                  value={formData.ownership_percentage}
                  onChange={(e) => setFormData({ ...formData, ownership_percentage: e.target.value })}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="tax_treatment">Steuerliche Behandlung</Label>
            <Select value={formData.tax_treatment} onValueChange={(v) => setFormData({ ...formData, tax_treatment: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KAPITALERTRAG">Kapitalertrag</SelectItem>
                <SelectItem value="PRIVATES_VERAEUSSERUNGSGESCHAEFT">Privates Veräußerungsgeschäft</SelectItem>
                <SelectItem value="GEWERBLICH">Gewerblich</SelectItem>
                <SelectItem value="STEUERFREI">Steuerfrei</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Input
              id="notes"
              placeholder="z.B. Mit Beglaubigung"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}