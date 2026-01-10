import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Camera, Mic, CheckCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function QuickTaskCreator({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    task_title: '',
    description: '',
    task_type: 'maintenance',
    priority: 'medium',
    attachments: []
  });
  const queryClient = useQueryClient();

  const { data: recentTasks = [] } = useQuery({
    queryKey: ['recentTasks', buildingId],
    queryFn: () => base44.entities.BuildingTask.filter(
      buildingId ? { building_id: buildingId } : {},
      '-created_date',
      10
    )
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BuildingTask.create({
        ...data,
        building_id: buildingId,
        status: 'open',
        created_by: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTasks'] });
      toast.success('Auftrag erstellt');
      setFormData({
        task_title: '',
        description: '',
        task_type: 'maintenance',
        priority: 'medium',
        attachments: []
      });
      setShowForm(false);
    }
  });

  const priorityOptions = [
    { value: 'low', label: '🟢 Niedrig', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: '🟡 Mittel', color: 'bg-slate-100 text-slate-800' },
    { value: 'high', label: '🟠 Hoch', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: '🔴 Dringend', color: 'bg-red-100 text-red-800' }
  ];

  const typeOptions = [
    { value: 'maintenance', label: '🔧 Wartung' },
    { value: 'repair', label: '⚠️ Reparatur' },
    { value: 'inspection', label: '🔍 Inspektion' },
    { value: 'cleaning', label: '🧹 Reinigung' }
  ];

  return (
    <div className="space-y-4">
      {/* Quick Add Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <Plus className="w-6 h-6 mr-2" />
          <span className="text-lg font-semibold">Neuer Auftrag</span>
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-base">Schnellerfassung</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <Input
                placeholder="Was muss erledigt werden?"
                value={formData.task_title}
                onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, priority: opt.value })}
                  className={`p-2 rounded-lg border-2 text-sm font-semibold ${
                    formData.priority === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, task_type: opt.value })}
                  className={`p-2 rounded-lg border-2 text-sm ${
                    formData.task_type === opt.value
                      ? 'border-blue-600 bg-blue-50 font-semibold'
                      : 'border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Zusätzliche Details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />

            <div>
              <label className="text-sm font-semibold mb-2 block">Fotos</label>
              <MobilePhotoUpload
                onUploadComplete={(urls) => setFormData({ ...formData, attachments: urls })}
                maxFiles={5}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.task_title}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Erstellen
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Letzte Aufträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTasks.map(task => (
              <div key={task.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-sm flex-1">{task.task_title}</p>
                  <Badge className={
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }>
                    {task.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  {new Date(task.created_date).toLocaleDateString('de-DE')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}