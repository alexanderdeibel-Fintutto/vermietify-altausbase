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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

export default function UnitQuickCreateDialog({
  open = false,
  onOpenChange,
  buildingId,
  onSuccess,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    unit_number: '',
    type: 'apartment',
    square_meters: '',
    rooms: '',
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSuccess) {
      await onSuccess(formData);
      setFormData({
        unit_number: '',
        type: 'apartment',
        square_meters: '',
        rooms: '',
        description: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🚪 Neue Einheit hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Einheitsnummer *</Label>
            <Input
              required
              value={formData.unit_number}
              onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
              placeholder="z.B. 1, A1, EG-01"
            />
          </div>

          <div>
            <Label>Typ</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Wohnung</SelectItem>
                <SelectItem value="garage">Garage</SelectItem>
                <SelectItem value="commercial">Gewerbe</SelectItem>
                <SelectItem value="storage">Lager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quadratmeter</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.square_meters}
                onChange={(e) => setFormData({ ...formData, square_meters: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Zimmer</Label>
              <Input
                type="number"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="3"
              />
            </div>
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="z.B. Souterrain, mit Balkon..."
              className="h-20"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900">
              Sie können später noch Mietverträge zu dieser Einheit hinzufügen.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Wird erstellt...' : 'Einheit erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}