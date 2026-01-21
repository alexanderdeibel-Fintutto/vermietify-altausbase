import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MaintenanceTracking() {
    const { data: tasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-created_date')
    });

    const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'Offen');
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'Erledigt');
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'Dringend');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wartungsverwaltung</h1>
                    <p className="vf-page-subtitle">{tasks.length} Wartungsaufträge</p>
                </div>
                <Button className="vf-btn-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Wartung
                </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{tasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
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
                        <div className="text-3xl font-bold">{urgentTasks.length}</div>
                        <div className="text-sm opacity-90 mt-1">Dringend</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Wartungsaufträge</h3>
                    <div className="space-y-2">
                        {tasks.slice(0, 10).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{task.title || task.titel}</div>
                                        <div className="text-sm text-gray-600">{task.description || task.beschreibung}</div>
                                    </div>
                                    <Badge className={
                                        task.priority === 'urgent' || task.priority === 'Dringend' ? 'vf-badge-error' :
                                        task.priority === 'high' || task.priority === 'Hoch' ? 'vf-badge-warning' :
                                        'vf-badge-default'
                                    }>
                                        {task.priority || task.prioritaet}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}