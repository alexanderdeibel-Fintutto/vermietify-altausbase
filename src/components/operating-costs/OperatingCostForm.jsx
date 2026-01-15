import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function OperatingCostForm({ buildingId, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cost_type: 'HEATING',
    description: '',
    amount: '',
    allocation_method: 'EQUAL',
    invoice_date: new Date().toISOString().split('T')[0]
  });

  const costTypeLabels = {
    HEATING: 'Heizung',
    WATER: 'Wasser',
    ELECTRICITY: 'Strom',
    INSURANCE: 'Versicherung',
    CLEANING: 'Reinigung',
    MAINTENANCE: 'Wartung',
    ADMIN: 'Verwaltung',
    GARBAGE: 'Müll',
    OTHER: 'Sonstiges'
  };

  const allocationLabels = {
    EQUAL: 'Gleich auf alle',
    PER_UNIT: 'Nach Wohnfläche',
    BY_METER: 'Nach Meterstand',
    CUSTOM: 'Benutzerdefiniert'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const item = await base44.entities.OperatingCostItem.create({
        building_id: buildingId,
        cost_type: formData.cost_type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        allocation_method: formData.allocation_method,
        invoice_date: formData.invoice_date,
        status: 'PENDING'
      });

      toast.success('Betriebskosten hinzugefügt');
      
      // Reset form
      setFormData({
        cost_type: 'HEATING',
        description: '',
        amount: '',
        allocation_method: 'EQUAL',
        invoice_date: new Date().toISOString().split('T')[0]
      });

      onCreated?.(item);
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Betriebskosten</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Kostenart</label>
              <select
                name="cost_type"
                value={formData.cost_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              >
                {Object.entries(costTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Rechnungsdatum</label>
              <Input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Beschreibung</label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="z.B. Heizöl Januar 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Gesamtbetrag (€)</label>
              <Input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="1200.50"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Verteilungsschlüssel</label>
              <select
                name="allocation_method"
                value={formData.allocation_method}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              >
                {Object.entries(allocationLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Betriebskosten erstellen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}