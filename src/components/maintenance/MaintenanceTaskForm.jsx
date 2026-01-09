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

export default function MaintenanceTaskForm({
  task,
  buildings = [],
  equipment = [],
  units = [],
  users = [],
  onSubmit,
  onCancel
}) {
  const [formData, setFormData] = useState(task || {
    title: '',
    description: '',
    task_type: 'maintenance',
    equipment_id: '',
    building_id: '',
    unit_id: '',
    assigned_to: '',
    priority: 'medium',
    status: 'open',
    due_date: '',
    scheduled_date: '',
    estimated_duration_hours: '',
    cost: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const taskTypes = [
    { value: 'inspection', label: '🔍 Inspektion' },
    { value: 'maintenance', label: '🔧 Wartung' },
    { value: 'repair', label: '🛠️ Reparatur' },
    { value: 'service', label: '📋 Service' },
    { value: 'cleaning', label: '🧹 Reinigung' },
    { value: 'other', label: '📝 Sonstiges' }
  ];

  const priorities = [
    { value: 'low', label: '🟢 Niedrig' },
    { value: 'medium', label: '🟡 Mittel' },
    { value: 'high', label: '🔴 Hoch' },
    { value: 'critical', label: '🚨 Kritisch' }
  ];

  const statuses = [
    { value: 'open', label: '📂 Offen' },
    { value: 'in_progress', label: '⏳ In Bearbeitung' },
    { value: 'completed', label: '✅ Abgeschlossen' },
    { value: 'cancelled', label: '❌ Abgebrochen' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Titel erforderlich';
    if (!formData.task_type) newErrors.task_type = 'Aufgabentyp erforderlich';
    if (!formData.building_id) newErrors.building_id = 'Gebäude erforderlich';
    if (!formData.due_date) newErrors.due_date = 'Fälligkeitsdatum erforderlich';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const selectedBuilding = buildings.find(b => b.id === formData.building_id);
  const filteredEquipment = selectedBuilding 
    ? equipment.filter(e => e.building_id === formData.building_id)
    : equipment;
  const filteredUnits = selectedBuilding?.units || units;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grundlegende Informationen */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Grundlegende Informationen</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-light text-slate-700">Titel *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Heizungswartung Gebäude A"
                className="mt-1 font-light"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1 font-light">{errors.title}</p>}
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaillierte Beschreibung der Aufgabe..."
                className="mt-1 font-light"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Aufgabentyp *</label>
                <Select value={formData.task_type} onValueChange={(value) => setFormData({ ...formData, task_type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.task_type && <p className="text-red-500 text-xs mt-1 font-light">{errors.task_type}</p>}
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Priorität</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Zuordnung */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Zuordnung</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-light text-slate-700">Gebäude *</label>
              <Select value={formData.building_id} onValueChange={(value) => setFormData({ ...formData, building_id: value, unit_id: '', equipment_id: '' })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Gerät (optional)</label>
                <Select value={formData.equipment_id} onValueChange={(value) => setFormData({ ...formData, equipment_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kein Gerät" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Kein Gerät</SelectItem>
                    {filteredEquipment.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Einheit (optional)</label>
                <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Keine Einheit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Keine Einheit</SelectItem>
                    {filteredUnits.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.number || u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Zugewiesen an</label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Nicht zugewiesen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nicht zugewiesen</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.email} value={u.email}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Termine */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Termine</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Fälligkeitsdatum *</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1 font-light"
                />
                {errors.due_date && <p className="text-red-500 text-xs mt-1 font-light">{errors.due_date}</p>}
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Geplantes Datum</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schätzungen */}
        <div>
          <h3 className="text-lg font-light mb-4 text-slate-900">Schätzungen</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-light text-slate-700">Geschätzte Dauer (Stunden)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimated_duration_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_hours: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>

              <div>
                <label className="text-sm font-light text-slate-700">Geschätzter Kostenbetrag (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="mt-1 font-light"
                />
              </div>
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
            rows={2}
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
            {task ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Card>
  );
}