import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SmartTaskManager from '@/components/tasks/SmartTaskManager';
import AutoTaskCreator from '@/components/tasks/AutoTaskCreator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Wrench, User, Calendar, CheckCircle, GitBranch, List } from 'lucide-react';
import { toast } from 'sonner';
import TaskCalendarView from '@/components/tasks/TaskCalendarView';
import TaskDependencyManager from '@/components/tasks/TaskDependencyManager';
import SubtaskManager from '@/components/tasks/SubtaskManager';
import AIAssignmentSuggestion from '@/components/tasks/AIAssignmentSuggestion';

export default function BuildingTasksManager({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [formData, setFormData] = useState({
    task_title: '',
    description: '',
    task_type: 'maintenance',
    priority: 'medium',
    assigned_to: '',
    assigned_role: 'building_manager',
    due_date: ''
  });
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['buildingTasks', buildingId],
    queryFn: () => base44.entities.BuildingTask.filter({ building_id: buildingId }, '-created_date', 100),
    enabled: !!buildingId
  });

  const { data: managers = [] } = useQuery({
    queryKey: ['buildingManagers'],
    queryFn: () => base44.entities.BuildingManager.list(null, 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BuildingTask.create({
      ...data,
      building_id: buildingId,
      status: 'assigned'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingTasks'] });
      toast.success('Aufgabe erstellt');
      setFormData({
        task_title: '',
        description: '',
        task_type: 'maintenance',
        priority: 'medium',
        assigned_to: '',
        assigned_role: 'building_manager',
        due_date: ''
      });
      setShowForm(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.BuildingTask.update(id, {
      status,
      ...(status === 'completed' && { completed_at: new Date().toISOString() })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingTasks'] });
      toast.success('Status aktualisiert');
    }
  });

  const statusColors = {
    open: 'bg-slate-100 text-slate-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      {/* AI Task Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SmartTaskManager buildingId={buildingId} />
        <AutoTaskCreator />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light text-slate-900">Aufgabenverwaltung</h2>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="w-4 h-4 mr-2" />
            Liste
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Kalender
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Neue Aufgabe
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
              <div>
                <Label>Aufgabentitel</Label>
                <Input
                  value={formData.task_title}
                  onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <Select value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Wartung</SelectItem>
                      <SelectItem value="inspection">Inspektion</SelectItem>
                      <SelectItem value="cleaning">Reinigung</SelectItem>
                      <SelectItem value="repair">Reparatur</SelectItem>
                      <SelectItem value="administrative">Verwaltung</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorität</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="urgent">Dringend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Zuweisen an</Label>
                  <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Person auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map(m => (
                        <SelectItem key={m.id} value={m.user_email}>
                          {m.full_name} ({m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fälligkeitsdatum</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Aufgabe erstellen
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {viewMode === 'calendar' ? (
        <TaskCalendarView buildingId={buildingId} />
      ) : (
        <>
      {selectedTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <SubtaskManager taskId={selectedTask.id} buildingId={buildingId} />
          <TaskDependencyManager taskId={selectedTask.id} buildingId={buildingId} />
          <AIAssignmentSuggestion taskId={selectedTask.id} buildingId={buildingId} />
        </div>
      )}

      <div className="space-y-3">
        {tasks.map(task => (
          <Card 
            key={task.id}
            className={`cursor-pointer transition-shadow ${selectedTask?.id === task.id ? 'ring-2 ring-blue-600' : ''}`}
            onClick={() => setSelectedTask(task)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{task.task_title}</h3>
                    {task.is_subtask && <Badge variant="outline" className="text-xs">Sub</Badge>}
                    {task.depends_on?.length > 0 && (
                      <GitBranch className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                  <Badge className={statusColors[task.status]}>{task.status}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                {task.assigned_to && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {managers.find(m => m.user_email === task.assigned_to)?.full_name || task.assigned_to}
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.due_date).toLocaleDateString('de-DE')}
                  </div>
                )}
                {task.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'completed' })}
                    className="ml-auto"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Erledigt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </>
      )}
    </div>
  );
}