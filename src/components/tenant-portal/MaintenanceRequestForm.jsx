import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
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
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function MaintenanceRequestForm({ tenantId, unitId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'repair',
    priority: 'medium',
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.MaintenanceTask.create({
        ...data,
        building_id: unitId ? (await base44.entities.Unit.read(unitId)).building_id : '',
        unit_id: unitId,
        assigned_to: '', // Wird vom Admin zugewiesen
        status: 'open',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', tenantId] });
      setFormData({ title: '', description: '', task_type: 'repair', priority: 'medium' });
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus(null), 5000);
    },
    onError: (error) => {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 5000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setSubmitStatus('validation');
      return;
    }
    createMaintenanceMutation.mutate(formData);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-light text-slate-900">Wartungsanfrage einreichen</h3>
        <p className="text-sm font-light text-slate-600 mt-1">
          Beschreiben Sie das Problem oder die erforderliche Wartung
        </p>
      </div>

      {submitStatus === 'success' && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-light text-green-800">Anfrage erfolgreich eingereicht!</p>
        </div>
      )}

      {submitStatus === 'validation' && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-light text-red-800">Bitte füllen Sie alle erforderlichen Felder aus</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-light text-slate-700">Problem/Titel *</label>
          <Input
            placeholder="z.B. Tropfender Wasserhahn"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 font-light"
          />
        </div>

        <div>
          <label className="text-sm font-light text-slate-700">Beschreibung *</label>
          <Textarea
            placeholder="Beschreiben Sie das Problem genauer..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 font-light"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-light text-slate-700">Anfragetyp</label>
            <Select value={formData.task_type} onValueChange={(value) => setFormData({ ...formData, task_type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">🔧 Reparatur</SelectItem>
                <SelectItem value="maintenance">🧹 Wartung</SelectItem>
                <SelectItem value="inspection">🔍 Inspektion</SelectItem>
                <SelectItem value="cleaning">✨ Reinigung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Priorität</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Niedrig</SelectItem>
                <SelectItem value="medium">🟡 Normal</SelectItem>
                <SelectItem value="high">🔴 Hoch</SelectItem>
                <SelectItem value="critical">⚠️ Kritisch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={createMaintenanceMutation.isPending}
            className="flex-1 bg-slate-900 hover:bg-slate-800 font-light"
          >
            {createMaintenanceMutation.isPending ? 'Wird eingereicht...' : 'Anfrage einreichen'}
          </Button>
        </div>
      </form>
    </Card>
  );
}