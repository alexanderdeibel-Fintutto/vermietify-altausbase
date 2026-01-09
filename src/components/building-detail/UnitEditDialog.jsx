import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function UnitEditDialog({ buildingId, unit, onClose }) {
  const [formData, setFormData] = useState(unit || {
    gebaeude_id: buildingId,
    unit_number: '',
    floor: 0,
    position: 'center',
    rooms: 1,
    sqm: 0,
    bathroom_type: 'shower',
    has_fitted_kitchen: false,
    has_balcony: false,
    has_basement: false,
    has_parking: false,
    base_rent: 0,
    status: 'vacant',
    floor_plan_url: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (unit?.id) {
        return await base44.entities.Unit.update(unit.id, data);
      } else {
        return await base44.entities.Unit.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingUnits'] });
      toast.success(unit ? 'Einheit aktualisiert' : 'Einheit erstellt');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{unit ? 'Einheit bearbeiten' : 'Neue Einheit'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Einheitsnummer</Label>
                <Input
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                  placeholder="z.B. 1A, EG Links"
                  required
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupied">Belegt</SelectItem>
                    <SelectItem value="vacant">Frei</SelectItem>
                    <SelectItem value="renovation">Renovierung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Etage</Label>
                <Input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Zimmer</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fläche (m²)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sqm}
                  onChange={(e) => setFormData({ ...formData, sqm: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kaltmiete (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_rent}
                  onChange={(e) => setFormData({ ...formData, base_rent: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Lage in Etage</Label>
                <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="center">Mitte</SelectItem>
                    <SelectItem value="right">Rechts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Badezimmer</Label>
              <Select value={formData.bathroom_type} onValueChange={(v) => setFormData({ ...formData, bathroom_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shower">Dusche</SelectItem>
                  <SelectItem value="bathtub">Badewanne</SelectItem>
                  <SelectItem value="both">Beides</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Ausstattung</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.has_fitted_kitchen}
                    onCheckedChange={(v) => setFormData({ ...formData, has_fitted_kitchen: v })}
                  />
                  <Label>Einbauküche</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.has_balcony}
                    onCheckedChange={(v) => setFormData({ ...formData, has_balcony: v })}
                  />
                  <Label>Balkon</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.has_basement}
                    onCheckedChange={(v) => setFormData({ ...formData, has_basement: v })}
                  />
                  <Label>Keller</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.has_parking}
                    onCheckedChange={(v) => setFormData({ ...formData, has_parking: v })}
                  />
                  <Label>Stellplatz</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Grundriss hochladen</Label>
              <MobilePhotoUpload
                onUploadComplete={(urls) => setFormData({ ...formData, floor_plan_url: urls[0] })}
                maxFiles={1}
              />
              {formData.floor_plan_url && (
                <img src={formData.floor_plan_url} alt="Grundriss" className="mt-2 rounded border max-h-48" />
              )}
            </div>

            <div>
              <Label>Notizen</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {unit ? 'Aktualisieren' : 'Erstellen'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}