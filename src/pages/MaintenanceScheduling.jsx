import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function MaintenanceScheduling() {
    const queryClient = useQueryClient();

    const { data: tasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.status === 'completed') return false;
        return new Date(t.due_date) < new Date();
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wartungsplanung</h1>
                    <p className="vf-page-subtitle">{tasks.length} Wartungsaufgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Wrench className="w-4 h-4" />
                        Neue Wartung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{overdueTasks.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Überfällig</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold">{pendingTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">In Bearbeitung</div>
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
                        <div className="text-3xl font-bold">{tasks.length}</div>
                        <div className="text-sm opacity-90 mt-1">Gesamt</div>
                    </CardContent>
                </Card>
            </div>

            {overdueTasks.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            Überfällige Wartungen
                        </h3>
                        <div className="space-y-2">
                            {overdueTasks.map((task) => {
                                const building = buildings.find(b => b.id === task.building_id);
                                return (
                                    <div key={task.id} className="p-3 bg-white rounded-lg border border-red-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">{task.title}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {building?.name} • Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>
                                            <Button size="sm" variant="destructive">Bearbeiten</Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {pendingTasks.map((task) => {
                    const building = buildings.find(b => b.id === task.building_id);
                    return (
                        <Card key={task.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Wrench className="w-8 h-8 text-blue-600" />
                                        <div>
                                            <h3 className="font-semibold">{task.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <span>{building?.name || 'Unbekannt'}</span>
                                                {task.due_date && (
                                                    <>
                                                        <span>•</span>
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{new Date(task.due_date).toLocaleDateString('de-DE')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={
                                            task.status === 'completed' ? 'vf-badge-success' :
                                            task.status === 'in_progress' ? 'vf-badge-info' :
                                            'vf-badge-default'
                                        }>
                                            {task.status || 'pending'}
                                        </Badge>
                                        <Button variant="outline" size="sm">Details</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}