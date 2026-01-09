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

export default function SendMessageDialog({ open, onOpenChange, tenants = [], buildings = [], onSend }) {
  const [formData, setFormData] = useState({
    communication_type: 'individual_message',
    title: '',
    content: '',
    recipient_type: 'individual',
    tenant_id: '',
    tenant_email: '',
    priority: 'normal'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Titel erforderlich';
    if (!formData.content.trim()) newErrors.content = 'Nachricht erforderlich';
    if (!formData.tenant_email && !formData.tenant_id) newErrors.tenant = 'Empfänger erforderlich';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedTenant = tenants.find(t => t.id === formData.tenant_id);
    
    onSend({
      ...formData,
      recipient_emails: [formData.tenant_email || selectedTenant?.email],
      recipient_type: 'individual'
    });

    setFormData({
      communication_type: 'individual_message',
      title: '',
      content: '',
      recipient_type: 'individual',
      tenant_id: '',
      tenant_email: '',
      priority: 'normal'
    });
    setErrors({});
    onOpenChange(false);
  };

  const selectedTenant = tenants.find(t => t.id === formData.tenant_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light">Nachricht an Mieter</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-light text-slate-700">Mieter *</label>
            <Select value={formData.tenant_id} onValueChange={(value) => {
              const tenant = tenants.find(t => t.id === value);
              setFormData({ ...formData, tenant_id: value, tenant_email: tenant?.email || '' });
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Mieter wählen" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tenant && <p className="text-red-500 text-xs mt-1 font-light">{errors.tenant}</p>}
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Betreff *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Wartungsmitteilung"
              className="mt-1 font-light"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1 font-light">{errors.title}</p>}
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Nachricht *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Schreiben Sie Ihre Nachricht..."
              className="mt-1 font-light"
              rows={4}
            />
            {errors.content && <p className="text-red-500 text-xs mt-1 font-light">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              Senden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}