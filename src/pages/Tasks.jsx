import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, Plus, Calendar, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

const statusOptions = [
    { value: 'Offen', label: 'Offen' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Erledigt', label: 'Erledigt' }
];

const priorityOptions = [
    { value: 'Niedrig', label: 'Niedrig' },
    { value: 'Mittel', label: 'Mittel' },
    { value: 'Hoch', label: 'Hoch' },
    { value: 'Dringend', label: 'Dringend' }
];

export default function Tasks() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        titel: '',
        beschreibung: '',
        prioritaet: 'Mittel',
        status: 'Offen',
        faelligkeitsdatum: ''
    });

    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list('-created_date')
    });

    const createTaskMutation = useMutation({
        mutationFn: (data) => base44.entities.Task.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setDialogOpen(false);
            setFormData({ titel: '', beschreibung: '', prioritaet: 'Mittel', status: 'Offen', faelligkeitsdatum: '' });
            showSuccess('Aufgabe erstellt');
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createTaskMutation.mutate(formData);
    };

    const toggleStatus = (task) => {
        const newStatus = task.status === 'Erledigt' ? 'Offen' : 'Erledigt';
        updateTaskMutation.mutate({ id: task.id, data: { status: newStatus } });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Aufgaben</h1>
                    <p className="vf-page-subtitle">{tasks.filter(t => t.status !== 'Erledigt').length} offene Aufgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Aufgabe hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Aufgabe</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Titel"
                                    value={formData.titel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, titel: e.target.value }))}
                                    required
                                />
                                <VfTextarea
                                    label="Beschreibung"
                                    value={formData.beschreibung}
                                    onChange={(e) => setFormData(prev => ({ ...prev, beschreibung: e.target.value }))}
                                    rows={3}
                                />
                                <VfSelect
                                    label="Priorität"
                                    value={formData.prioritaet}
                                    onChange={(value) => setFormData(prev => ({ ...prev, prioritaet: value }))}
                                    options={priorityOptions}
                                />
                                <VfInput
                                    label="Fälligkeitsdatum"
                                    type="date"
                                    value={formData.faelligkeitsdatum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, faelligkeitsdatum: e.target.value }))}
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Erstellen
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {tasks.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <CheckCircle2 className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Keine Aufgaben</h3>
                            <p className="text-gray-600 mb-6">Erstellen Sie Ihre erste Aufgabe</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erste Aufgabe erstellen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <Card key={task.id} className={task.status === 'Erledigt' ? 'opacity-60' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => toggleStatus(task)} className="flex-shrink-0">
                                        {task.status === 'Erledigt' ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-gray-400" />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <h3 className={`font-semibold ${task.status === 'Erledigt' ? 'line-through' : ''}`}>
                                            {task.titel}
                                        </h3>
                                        {task.beschreibung && (
                                            <p className="text-sm text-gray-600 mt-1">{task.beschreibung}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className={
                                                task.prioritaet === 'Dringend' ? 'vf-badge-error' :
                                                task.prioritaet === 'Hoch' ? 'vf-badge-warning' :
                                                'vf-badge-default'
                                            }>
                                                {task.prioritaet}
                                            </Badge>
                                            {task.faelligkeitsdatum && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}