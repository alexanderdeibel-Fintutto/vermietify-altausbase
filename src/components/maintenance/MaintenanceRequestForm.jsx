import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Upload, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceRequestForm({ leaseContractId, unitId, tenantEmail }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    urgency: 'MEDIUM',
    preferred_dates: [''],
    photos: []
  });

  const categories = [
    { value: 'PLUMBING', label: 'Sanitär/Rohre' },
    { value: 'ELECTRICAL', label: 'Elektrik' },
    { value: 'HEATING', label: 'Heizung' },
    { value: 'COOLING', label: 'Klimaanlage' },
    { value: 'APPLIANCE', label: 'Geräte' },
    { value: 'STRUCTURAL', label: 'Bauwerk' },
    { value: 'PEST', label: 'Schädlinge' },
    { value: 'OTHER', label: 'Sonstiges' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Bitte Titel und Beschreibung ausfüllen');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.MaintenanceRequest.create({
        lease_contract_id: leaseContractId,
        unit_id: unitId,
        tenant_email: tenantEmail,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        preferred_dates: formData.preferred_dates.filter(d => d),
        photos: formData.photos,
        requested_date: new Date().toISOString(),
        status: 'NEW'
      });

      toast.success('Wartungsanfrage eingereicht');
      setFormData({
        title: '',
        description: '',
        category: 'OTHER',
        urgency: 'MEDIUM',
        preferred_dates: [''],
        photos: []
      });
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wartungsanfrage einreichen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Problem (Kurzbeschreibung)*</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="z.B. Wasserhahn tropft"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Detaillierte Beschreibung*</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Bitte beschreiben Sie das Problem genauer..."
              rows="4"
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kategorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dringlichkeit</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="EMERGENCY">Notfall</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bevorzugte Termine (optional)</label>
            {formData.preferred_dates.map((date, idx) => (
              <Input
                key={idx}
                type="date"
                value={date}
                onChange={(e) => {
                  const newDates = [...formData.preferred_dates];
                  newDates[idx] = e.target.value;
                  setFormData({...formData, preferred_dates: newDates});
                }}
                className="mb-2"
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({...formData, preferred_dates: [...formData.preferred_dates, '']})}
            >
              + Weiterer Termin
            </Button>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Send className="w-4 h-4 mr-2" />
            Anfrage einreichen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}