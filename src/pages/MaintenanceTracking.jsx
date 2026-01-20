import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MaintenanceTracking() {
    const { data: tasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const openTasks = tasks.filter(t => t.status === 'Offen' || t.status === 'In Bearbeitung');
    const completedTasks = tasks.filter(t => t.status === 'Erledigt');
    const urgentTasks = tasks.filter(t => t.prioritaet === 'Dringend' && t.status !== 'Erledigt');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wartungsverwaltung</h1>
                    <p className="vf-page-subtitle">{tasks.length} Wartungsaufgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Wrench className="w-4 h-4 mr-2" />
                        Neue Wartung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aufgaben gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{openTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Offen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{completedTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Erledigt</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{urgentTasks.length}</div>
                        <div className="text-sm opacity-90 mt-1">Dringend</div>
                    </CardContent>
                </Card>
            </div>

            {urgentTasks.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            Dringende Aufgaben ({urgentTasks.length})
                        </h3>
                        <div className="space-y-2">
                            {urgentTasks.map((task) => {
                                const building = buildings.find(b => b.id === task.building_id);
                                return (
                                    <div key={task.id} className="p-3 bg-white rounded-lg border border-red-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">{task.titel}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {building?.name || 'Unbekannt'}
                                                </div>
                                            </div>
                                            <Badge className="vf-badge-error">Dringend</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Offene Aufgaben</h3>
                        <div className="space-y-2">
                            {openTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <div className="text-xs text-gray-600 mt-1">{task.kategorie}</div>
                                    <Badge className="mt-2 vf-badge-warning text-xs">{task.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Erledigte Aufgaben</h3>
                        <div className="space-y-2">
                            {completedTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {task.erledigt_am && new Date(task.erledigt_am).toLocaleDateString('de-DE')}
                                    </div>
                                    <Badge className="mt-2 vf-badge-success text-xs">Erledigt</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}