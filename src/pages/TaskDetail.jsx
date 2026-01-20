import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, AlertCircle, ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function TaskDetail() {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('id');
    const queryClient = useQueryClient();

    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const tasks = await base44.entities.Task.filter({ id: taskId });
            return tasks[0];
        },
        enabled: !!taskId
    });

    const { data: building } = useQuery({
        queryKey: ['building', task?.building_id],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: task.building_id });
            return buildings[0];
        },
        enabled: !!task?.building_id
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status) => base44.entities.Task.update(taskId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showSuccess('Status aktualisiert');
        }
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    if (!task) {
        return <div className="text-center py-20">Aufgabe nicht gefunden</div>;
    }

    return (
        <div className="space-y-6">
            <Link to={createPageUrl('Tasks')} className="vf-page-back">
                <ArrowLeft className="w-4 h-4" />
                Zurück zu Aufgaben
            </Link>

            <div className="vf-detail-header">
                <div className="vf-detail-header__top">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-white ${
                            task.prioritaet === 'Dringend' ? 'bg-red-600' :
                            task.prioritaet === 'Hoch' ? 'bg-orange-600' :
                            'bg-blue-600'
                        }`}>
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div className="vf-detail-header__info">
                            <h1 className="vf-detail-header__title">{task.titel}</h1>
                            <p className="vf-detail-header__subtitle">Erstellt am {new Date(task.created_date).toLocaleDateString('de-DE')}</p>
                        </div>
                    </div>
                    <div className="vf-detail-header__actions">
                        <Button variant="outline">Bearbeiten</Button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {task.beschreibung && (
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Beschreibung</div>
                                    <p className="text-gray-700">{task.beschreibung}</p>
                                </div>
                            )}
                            {task.notizen && (
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Notizen</div>
                                    <p className="text-gray-700">{task.notizen}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status & Priorität</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-2">Status</div>
                                <div className="flex flex-wrap gap-2">
                                    {['Offen', 'In Bearbeitung', 'Erledigt'].map(status => (
                                        <Button
                                            key={status}
                                            variant={task.status === status ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => updateStatusMutation.mutate(status)}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-2">Priorität</div>
                                <Badge className={
                                    task.prioritaet === 'Dringend' ? 'vf-badge-error' :
                                    task.prioritaet === 'Hoch' ? 'vf-badge-warning' :
                                    'vf-badge-default'
                                }>
                                    {task.prioritaet}
                                </Badge>
                            </div>
                            {task.faelligkeitsdatum && (
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Fälligkeit</div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {building && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gebäude</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Link to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                                    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold">{building.name}</span>
                                        </div>
                                        <div className="text-sm text-gray-600">{building.ort}</div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}