import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench, Plus, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

const statusOptions = [
    { value: 'Offen', label: 'Offen' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Erledigt', label: 'Erledigt' }
];

const priorityOptions = [
    { value: 'Niedrig', label: 'Niedrig' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Hoch', label: 'Hoch' },
    { value: 'Notfall', label: 'Notfall' }
];

export default function MaintenanceManager() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        building_id: '',
        titel: '',
        beschreibung: '',
        prioritaet: 'Normal',
        status: 'Offen',
        faelligkeit: ''
    });

    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const createTaskMutation = useMutation({
        mutationFn: (data) => base44.entities.MaintenanceTask.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
            setDialogOpen(false);
            setFormData({ building_id: '', titel: '', beschreibung: '', prioritaet: 'Normal', status: 'Offen', faelligkeit: '' });
            showSuccess('Wartungsaufgabe erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createTaskMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    const openTasks = tasks.filter(t => t.status !== 'Erledigt').length;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wartung & Instandhaltung</h1>
                    <p className="vf-page-subtitle">{openTasks} offene Aufgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Wartung hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Wartungsaufgabe</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Gebäude"
                                    value={formData.building_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, building_id: value }))}
                                    options={buildings.map(b => ({ value: b.id, label: b.name }))}
                                    required
                                />
                                <VfInput
                                    label="Titel"
                                    value={formData.titel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, titel: e.target.value }))}
                                    placeholder="z.B. Heizungswartung"
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
                                    label="Fälligkeit"
                                    type="date"
                                    value={formData.faelligkeit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, faelligkeit: e.target.value }))}
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
                            <Wrench className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Wartungsaufgaben</h3>
                            <p className="text-gray-600 mb-6">Erstellen Sie Ihre erste Wartungsaufgabe</p>
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
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <Wrench className="w-8 h-8 text-orange-600 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">{task.titel}</h3>
                                            {task.beschreibung && (
                                                <p className="text-sm text-gray-600 mb-2">{task.beschreibung}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Badge className={
                                                    task.prioritaet === 'Notfall' ? 'vf-badge-error' :
                                                    task.prioritaet === 'Hoch' ? 'vf-badge-warning' :
                                                    'vf-badge-default'
                                                }>
                                                    {task.prioritaet === 'Notfall' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {task.prioritaet}
                                                </Badge>
                                                <Badge className={
                                                    task.status === 'Erledigt' ? 'vf-badge-success' :
                                                    task.status === 'In Bearbeitung' ? 'vf-badge-info' :
                                                    'vf-badge-default'
                                                }>
                                                    {task.status}
                                                </Badge>
                                                {task.faelligkeit && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.faelligkeit).toLocaleDateString('de-DE')}
                                                    </span>
                                                )}
                                            </div>
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