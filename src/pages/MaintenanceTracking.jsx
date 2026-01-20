import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function MaintenanceTracking() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        beschreibung: '',
        prioritaet: 'Mittel',
        status: 'Offen',
        building_id: ''
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
            setFormData({ title: '', beschreibung: '', prioritaet: 'Mittel', status: 'Offen', building_id: '' });
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

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wartung & Instandhaltung</h1>
                    <p className="vf-page-subtitle">{tasks.length} Aufgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Neue Aufgabe
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Wartungsaufgabe erstellen</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Titel"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                                <VfTextarea
                                    label="Beschreibung"
                                    value={formData.beschreibung}
                                    onChange={(e) => setFormData(prev => ({ ...prev, beschreibung: e.target.value }))}
                                    rows={3}
                                />
                                <VfSelect
                                    label="Gebäude"
                                    value={formData.building_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, building_id: value }))}
                                    options={buildings.map(b => ({ value: b.id, label: b.name }))}
                                />
                                <VfSelect
                                    label="Priorität"
                                    value={formData.prioritaet}
                                    onChange={(value) => setFormData(prev => ({ ...prev, prioritaet: value }))}
                                    options={[
                                        { value: 'Niedrig', label: 'Niedrig' },
                                        { value: 'Mittel', label: 'Mittel' },
                                        { value: 'Hoch', label: 'Hoch' },
                                        { value: 'Dringend', label: 'Dringend' }
                                    ]}
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
                            <h3 className="text-xl font-semibold mb-2">Keine Wartungsaufgaben</h3>
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
                    {tasks.map((task) => {
                        const building = buildings.find(b => b.id === task.building_id);
                        return (
                            <Card key={task.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                                                task.prioritaet === 'Dringend' ? 'bg-red-600' :
                                                task.prioritaet === 'Hoch' ? 'bg-orange-600' :
                                                'bg-blue-600'
                                            }`}>
                                                <Wrench className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">{task.title}</h3>
                                                {task.beschreibung && (
                                                    <p className="text-sm text-gray-700 mb-2">{task.beschreibung}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    {building && <span>{building.name}</span>}
                                                    <span>•</span>
                                                    <span>{new Date(task.created_date).toLocaleDateString('de-DE')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className={
                                                task.status === 'Erledigt' ? 'vf-badge-success' :
                                                task.status === 'In Bearbeitung' ? 'vf-badge-info' :
                                                'vf-badge-warning'
                                            }>
                                                {task.status}
                                            </Badge>
                                            <Badge className={
                                                task.prioritaet === 'Dringend' ? 'vf-badge-error' :
                                                task.prioritaet === 'Hoch' ? 'vf-badge-warning' :
                                                'vf-badge-default'
                                            }>
                                                {task.prioritaet}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}