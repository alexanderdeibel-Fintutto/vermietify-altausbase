import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, FileText, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ComplianceCenter() {
    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list('-created_date')
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list()
    });

    const complianceTasks = tasks.filter(t => t.kategorie === 'Steuer' || t.kategorie === 'Frist' || t.kategorie === 'Verwaltung');
    const overdueTasks = complianceTasks.filter(t => {
        const dueDate = new Date(t.faelligkeitsdatum);
        return dueDate < new Date() && (t.status === 'Offen' || t.status === 'open');
    });
    const upcomingTasks = complianceTasks.filter(t => {
        const dueDate = new Date(t.faelligkeitsdatum);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        return dueDate >= today && dueDate <= thirtyDaysFromNow && (t.status === 'Offen' || t.status === 'open');
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Compliance-Zentrum</h1>
                    <p className="vf-page-subtitle">Regulatorische Anforderungen & Fristen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Compliance-Aufgabe
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{complianceTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Compliance-Aufgaben</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{overdueTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Überfällig</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{upcomingTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Bald fällig</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {(((complianceTasks.filter(t => t.status === 'Erledigt' || t.status === 'completed').length) / complianceTasks.length) * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">Erfüllt</div>
                    </CardContent>
                </Card>
            </div>

            {overdueTasks.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            Überfällige Aufgaben ({overdueTasks.length})
                        </h3>
                        <div className="space-y-2">
                            {overdueTasks.map((task) => (
                                <div key={task.id} className="p-3 bg-white rounded-lg border border-red-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{task.titel}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Fällig: {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                        <Badge className="vf-badge-error">Überfällig</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Bald fällige Aufgaben ({upcomingTasks.length})</h3>
                    <div className="space-y-2">
                        {upcomingTasks.map((task) => (
                            <div key={task.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">{task.titel}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Fällig: {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <Badge className="vf-badge-warning">
                                        {Math.ceil((new Date(task.faelligkeitsdatum) - new Date()) / (24 * 60 * 60 * 1000))} Tage
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