import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'heating', label: 'Heizung' },
  { value: 'plumbing', label: 'Sanitär' },
  { value: 'electrical', label: 'Elektrik' },
  { value: 'doors', label: 'Türen/Fenster' },
  { value: 'cleaning', label: 'Reinigung' },
  { value: 'other', label: 'Sonstiges' }
];

const PRIORITY = [
  { value: 'low', label: 'Niedrig - innerhalb 14 Tagen' },
  { value: 'medium', label: 'Mittel - innerhalb 7 Tagen' },
  { value: 'high', label: 'Hoch - innerhalb 2 Tagen' },
  { value: 'urgent', label: 'Dringend - heute' }
];

export default function MaintenanceRequestForm({ tenantId, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await base44.functions.invoke('createMaintenanceRequest', {
        tenant_id: tenantId,
        ...formData
      });
      toast.success('Anfrage eingereicht');
      onSubmit();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-base">Neue Wartungsanfrage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Kategorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Priorität</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            >
              {PRIORITY.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Titel</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Tropfender Wasserhahn im Bad"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beschreibe das Problem detailliert..."
              className="min-h-24"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird eingereicht...
                </>
              ) : (
                'Anfrage absenden'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}