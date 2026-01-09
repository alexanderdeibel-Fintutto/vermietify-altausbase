import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function SendAnnouncementDialog({ open, onOpenChange, buildings = [], onSend }) {
  const [formData, setFormData] = useState({
    communication_type: 'announcement',
    title: '',
    content: '',
    recipient_type: 'all_tenants',
    building_id: '',
    priority: 'normal'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Titel erforderlich';
    if (!formData.content.trim()) newErrors.content = 'Inhalt erforderlich';
    if (formData.recipient_type === 'building_tenants' && !formData.building_id) {
      newErrors.building_id = 'Gebäude erforderlich';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSend({
      ...formData,
      recipient_emails: []
    });

    setFormData({
      communication_type: 'announcement',
      title: '',
      content: '',
      recipient_type: 'all_tenants',
      building_id: '',
      priority: 'normal'
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light">Ankündigung versenden</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-light text-slate-700">Empfänger</label>
            <Select value={formData.recipient_type} onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tenants">📢 Alle Mieter</SelectItem>
                <SelectItem value="building_tenants">🏢 Mieter eines Gebäudes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.recipient_type === 'building_tenants' && (
            <div>
              <label className="text-sm font-light text-slate-700">Gebäude *</label>
              <Select value={formData.building_id} onValueChange={(value) => setFormData({ ...formData, building_id: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Gebäude wählen" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.building_id && <p className="text-red-500 text-xs mt-1 font-light">{errors.building_id}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-light text-slate-700">Betreff *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Wartungsarbeiten im Treppenhaus"
              className="mt-1 font-light"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1 font-light">{errors.title}</p>}
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Ankündigung *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Geben Sie die Ankündigung ein..."
              className="mt-1 font-light"
              rows={4}
            />
            {errors.content && <p className="text-red-500 text-xs mt-1 font-light">{errors.content}</p>}
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Priorität</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Niedrig</SelectItem>
                <SelectItem value="normal">🟡 Normal</SelectItem>
                <SelectItem value="high">🔴 Hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 font-light"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-light"
            >
              Versenden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}