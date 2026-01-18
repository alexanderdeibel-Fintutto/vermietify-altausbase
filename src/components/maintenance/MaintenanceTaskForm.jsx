import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function MaintenanceTaskForm({ task, onSubmit }) {
  const [formData, setFormData] = useState(task || {
    title: '',
    description: '',
    priority: 'Mittel',
    due_date: '',
    assigned_to: ''
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
        rows={4}
      />

      <VfSelect
        label="Priorität"
        value={formData.priority}
        onChange={(v) => setFormData({ ...formData, priority: v })}
        options={[
          { value: 'Niedrig', label: 'Niedrig' },
          { value: 'Mittel', label: 'Mittel' },
          { value: 'Hoch', label: 'Hoch' },
          { value: 'Dringend', label: 'Dringend' }
        ]}
      />

      <VfDatePicker
        label="Fälligkeitsdatum"
        value={formData.due_date}
        onChange={(v) => setFormData({ ...formData, due_date: v })}
      />

      <Button variant="gradient" className="w-full" onClick={() => onSubmit(formData)}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}