import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function EquipmentForm({ equipment, buildings = [], units = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState(equipment || {
    name: '',
    equipment_type: '',
    serial_number: '',
    manufacturer: '',
    model: '',
    building_id: '',
    unit_id: '',
    location: '',
    installation_date: '',
    last_maintenance_date: '',
    next_maintenance_date: '',
    maintenance_interval_months: 12,
    status: 'active',
    warranty_until: '',
    purchase_price: '',
    cost_center: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const equipmentTypes = [
    { value: 'heating_system', label: '🔥 Heizungsanlage' },
    { value: 'cooling_system', label: '❄️ Kühlanlage' },
    { value: 'elevator', label: '🛗 Aufzug' },
    { value: 'pump', label: '💧 Pumpe' },
    { value: 'boiler', label: '🫖 Kessel' },
    { value: 'generator', label: '⚡ Generator' },
    { value: 'water_heater', label: '🌡️ Warmwasserbereiter' },
    { value: 'ventilation', label: '💨 Lüftungsanlage' },
    { value: 'other', label: '📦 Sonstiges' }
  ];

  const statusOptions = [
    { value: 'active', label: '✅ Aktiv' },
    { value: 'inactive', label: '⭕ Inaktiv' },
    { value: 'maintenance', label: '🔧 In Wartung' },
    { value: 'defective', label: '❌ Defekt' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name erforderlich';
    if (!formData.equipment_type) newErrors.equipment_type = 'Gerätetyp erforderlich';
    if (!formData.building_id) newErrors.building_id = 'Gebäude erforderlich';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const selectedBuilding = buildings.find(b => b.id === formData.building_id);
  const filteredUnits = selectedBuilding?.units || units;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grundlegende Informationen */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Grundlegende Informationen</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-light text-slate-700">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Heizungsanlage im Keller"
                className="mt-1 font-light"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-light">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Gerätetyp *</label>
                <Select value={formData.equipment_type} onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipment_type && <p className="text-red-500 text-xs mt-1 font-light">{errors.equipment_type}</p>}
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Hersteller</label>
                <Input
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="z.B. Viessmann"
                  className="mt-1 font-light"
                />
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Modell</label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Seriennummer</label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="mt-1 font-light"
              />
            </div>
          </div>
        </div>

        {/* Standort */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Standort</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-light text-slate-700">Gebäude *</label>
              <Select value={formData.building_id} onValueChange={(value) => setFormData({ ...formData, building_id: value, unit_id: '' })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wählen" />
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

            <div>
              <label className="text-sm font-light text-slate-700">Einheit (optional)</label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Keine spezifische Einheit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Keine spezifische Einheit</SelectItem>
                  {filteredUnits.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.number || u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Standortbeschreibung</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. Keller, Heizungsraum, 3. Stock"
                className="mt-1 font-light"
              />
            </div>
          </div>
        </div>

        {/* Wartung */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Wartung</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Installationsdatum</label>
                <Input
                  type="date"
                  value={formData.installation_date}
                  onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Letztes Wartungsdatum</label>
                <Input
                  type="date"
                  value={formData.last_maintenance_date}
                  onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Nächstes Wartungsdatum</label>
                <Input
                  type="date"
                  value={formData.next_maintenance_date}
                  onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Wartungsintervall (Monate)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maintenance_interval_months}
                  onChange={(e) => setFormData({ ...formData, maintenance_interval_months: parseInt(e.target.value) || 12 })}
                  className="mt-1 font-light"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Finanzielle Informationen */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Finanzielle Informationen</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Anschaffungskosten (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Garantie bis</label>
                <Input
                  type="date"
                  value={formData.warranty_until}
                  onChange={(e) => setFormData({ ...formData, warranty_until: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Kostenstelle</label>
              <Input
                value={formData.cost_center}
                onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                placeholder="z.B. 4100, Heizung"
                className="mt-1 font-light"
              />
            </div>
          </div>
        </div>

        {/* Notizen */}
        <div>
          <label className="text-sm font-light text-slate-700">Notizen</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Zusätzliche Informationen..."
            className="mt-1 font-light"
            rows={3}
          />
        </div>

        {/* Aktionen */}
        <div className="flex gap-2 pt-6 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 font-light"
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-light"
          >
            {equipment ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Card>
  );
}