import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell } from 'lucide-react';

export default function PriceAlertDialog({ open, onOpenChange, onSave, assets = [] }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    alert_type: 'price_above',
    threshold_value: '',
    notification_method: 'in_app'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      threshold_value: parseFloat(formData.threshold_value),
      is_active: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            Kurs-Alarm erstellen
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Asset
            </label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Bitte wählen...</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Alarmtyp
            </label>
            <select
              value={formData.alert_type}
              onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="price_above">Kurs über</option>
              <option value="price_below">Kurs unter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Zielwert (EUR)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.threshold_value}
              onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
              placeholder="z.B. 100.00"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
              Alarm erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}