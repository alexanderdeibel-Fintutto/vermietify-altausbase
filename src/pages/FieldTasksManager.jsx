import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Home, 
  FileText, 
  Wrench, 
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Mic,
  Calendar,
  Filter
} from 'lucide-react';
import FieldTaskDetailDialog from '@/components/field-tasks/FieldTaskDetailDialog';
import FieldTaskQuickCreate from '@/components/field-tasks/FieldTaskQuickCreate';

export default function FieldTasksManager() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['field-tasks', selectedCategory, selectedStatus],
    queryFn: async () => {
      let filters = {};
      if (selectedCategory !== 'all') filters.task_category = selectedCategory;
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      return await base44.entities.FieldTask.filter(filters, '-created_date', 100);
    }
  });

  const categories = [
    { id: 'all', label: 'Alle', icon: Building },
    { id: 'objekt_stammdaten', label: 'Stammdaten', icon: FileText },
    { id: 'objekt_zaehler', label: 'Zähler', icon: Clock },
    { id: 'objekt_technik', label: 'Technik', icon: Wrench },
    { id: 'objekt_aussenanlagen', label: 'Außenanlagen', icon: Home },
    { id: 'objekt_gemeinschaftsflaechen', label: 'Gemeinschaftsflächen', icon: Building }
  ];

  const statuses = [
    { id: 'all', label: 'Alle' },
    { id: 'offen', label: 'Offen', color: 'bg-slate-100 text-slate-800' },
    { id: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800' },
    { id: 'erledigt', label: 'Erledigt', color: 'bg-green-100 text-green-800' }
  ];

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'sofort': return <Badge className="bg-red-500 text-white">Sofort</Badge>;
      case 'hoch': return <Badge className="bg-orange-500 text-white">Hoch</Badge>;
      case 'normal': return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case 'niedrig': return <Badge className="bg-slate-100 text-slate-800">Niedrig</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = statuses.find(s => s.id === status);
    if (!statusConfig || !statusConfig.color) return null;
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vor-Ort Aufgaben</h1>
          <p className="text-slate-600 mt-1">Verwaltung aller Feldaufgaben und Dokumentationen</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Camera className="w-4 h-4 mr-2" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Offen</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'offen').length}</p>
              </div>
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Bearbeitung</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_bearbeitung').length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Erledigt (heute)</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => 
                    t.status === 'erledigt' && 
                    t.completed_date && 
                    new Date(t.completed_date).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Sofort</p>
                <p className="text-2xl font-bold text-red-500">
                  {tasks.filter(t => t.priority === 'sofort' && t.status !== 'erledigt').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">Kategorie:</span>
            </div>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <cat.icon className="w-4 h-4 mr-2" />
                {cat.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">Status:</span>
            </div>
            {statuses.map(status => (
              <Button
                key={status.id}
                variant={selectedStatus === status.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status.id)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="grid gap-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Lade Aufgaben...
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Keine Aufgaben gefunden
            </CardContent>
          </Card>
        ) : (
          tasks.map(task => (
            <Card 
              key={task.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTask(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {task.building_id && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          Gebäude
                        </span>
                      )}
                      {task.unit_id && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          Wohnung
                        </span>
                      )}
                      {task.photos?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {task.photos.length} Fotos
                        </span>
                      )}
                      {task.voice_notes?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          {task.voice_notes.length} Notizen
                        </span>
                      )}
                      {task.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.scheduled_date).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      {selectedTask && (
        <FieldTaskDetailDialog
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
        />
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <FieldTaskQuickCreate
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}