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

export default function PreciousMetalFormDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    metal_type: 'GOLD',
    name: '',
    form: 'BARREN',
    weight_grams: '',
    weight_unit: 'GRAMM',
    purity: '',
    manufacturer: '',
    certification: '',
    storage_location: 'ZUHAUSE',
    storage_details: '',
    current_price_per_gram: '',
    insurance_value: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      weight_grams: formData.weight_grams ? parseFloat(formData.weight_grams) : null,
      purity: formData.purity ? parseFloat(formData.purity) : null,
      current_price_per_gram: formData.current_price_per_gram ? parseFloat(formData.current_price_per_gram) : null,
      insurance_value: formData.insurance_value ? parseFloat(formData.insurance_value) : null,
      current_price_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edelmetall hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metal_type">Metallart *</Label>
              <Select value={formData.metal_type} onValueChange={(v) => setFormData({ ...formData, metal_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="SILBER">Silber</SelectItem>
                  <SelectItem value="PLATIN">Platin</SelectItem>
                  <SelectItem value="PALLADIUM">Palladium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Krügerrand 1oz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form">Form *</Label>
              <Select value={formData.form} onValueChange={(v) => setFormData({ ...formData, form: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BARREN">Barren</SelectItem>
                  <SelectItem value="MUENZE">Münze</SelectItem>
                  <SelectItem value="PAPIER_ETC">Papierform</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight">Gewicht *</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                placeholder="z.B. 31.1"
                value={formData.weight_grams}
                onChange={(e) => setFormData({ ...formData, weight_grams: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purity">Feingehalt (Promille)</Label>
              <Input
                id="purity"
                type="number"
                step="1"
                placeholder="z.B. 999.9"
                value={formData.purity}
                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">Hersteller</Label>
              <Input
                id="manufacturer"
                placeholder="z.B. Heraeus, PAMP"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storage">Lagerort *</Label>
              <Select value={formData.storage_location} onValueChange={(v) => setFormData({ ...formData, storage_location: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZUHAUSE">Zuhause</SelectItem>
                  <SelectItem value="BANKSCHLIESSFACH">Bankschliessfach</SelectItem>
                  <SelectItem value="EDELMETALLHAENDLER">Edelmetallhändler</SelectItem>
                  <SelectItem value="ZOLLFREILAGER">Zollfreilager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="storage_details">Lagerort-Details</Label>
              <Input
                id="storage_details"
                placeholder="z.B. Bank XY, Fachnr. 123"
                value={formData.storage_details}
                onChange={(e) => setFormData({ ...formData, storage_details: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Preis pro Gramm (EUR)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="z.B. 65.50"
                value={formData.current_price_per_gram}
                onChange={(e) => setFormData({ ...formData, current_price_per_gram: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="insurance">Versicherungswert (EUR)</Label>
              <Input
                id="insurance"
                type="number"
                step="0.01"
                placeholder="z.B. 2000"
                value={formData.insurance_value}
                onChange={(e) => setFormData({ ...formData, insurance_value: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Input
              id="notes"
              placeholder="z.B. Mit Echtheitszertifikat"
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