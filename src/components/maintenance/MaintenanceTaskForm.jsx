import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function MaintenanceTaskForm({ task, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'open',
    due_date: task?.due_date || ''
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Titel"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <VfTextarea
        label="Beschreibung"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <VfSelect
          label="Priorität"
          value={formData.priority}
          onChange={(v) => setFormData({ ...formData, priority: v })}
          options={[
            { value: 'low', label: 'Niedrig' },
            { value: 'medium', label: 'Mittel' },
            { value: 'high', label: 'Hoch' },
            { value: 'urgent', label: 'Dringend' }
          ]}
        />

        <VfSelect
          label="Status"
          value={formData.status}
          onChange={(v) => setFormData({ ...formData, status: v })}
          options={[
            { value: 'open', label: 'Offen' },
            { value: 'in_progress', label: 'In Bearbeitung' },
            { value: 'completed', label: 'Erledigt' }
          ]}
        />
      </div>

      <VfDatePicker
        label="Fälligkeitsdatum"
        value={formData.due_date}
        onChange={(v) => setFormData({ ...formData, due_date: v })}
      />

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button 
          variant="gradient"
          onClick={() => onSubmit(formData)}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );
}