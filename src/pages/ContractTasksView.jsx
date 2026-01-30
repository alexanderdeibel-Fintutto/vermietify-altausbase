import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
    todo: <Circle className="w-5 h-5 text-gray-400" />,
    in_progress: <Clock className="w-5 h-5 text-blue-500" />,
    completed: <CheckCircle className="w-5 h-5 text-green-500" />
};

export default function ContractTasksView() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadTasks();

        const unsubscribe = base44.entities.Task.subscribe((event) => {
            if (event.type === 'create') {
                setTasks(prev => [event.data, ...prev]);
            } else if (event.type === 'update') {
                setTasks(prev => prev.map(t => t.id === event.id ? event.data : t));
            } else if (event.type === 'delete') {
                setTasks(prev => prev.filter(t => t.id !== event.id));
            }
        });

        return unsubscribe;
    }, []);

    async function loadTasks() {
        try {
            // Lade alle Tasks, die mit ContractAnalysis verknüpft sind
            const allTasks = await base44.entities.Task.list('-created_date', 100);
            const contractTasks = allTasks.filter(t => t.related_entity_type === 'ContractAnalysis');
            setTasks(contractTasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            toast.error('Fehler beim Laden der Tasks');
        } finally {
            setLoading(false);
        }
    }

    async function updateTaskStatus(taskId, newStatus) {
        try {
            await base44.entities.Task.update(taskId, { status: newStatus });
            toast.success('Status aktualisiert');
        } catch (error) {
            toast.error('Fehler beim Aktualisieren');
        }
    }

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === 'todo' || task.status === 'in_progress';
        if (filter === 'urgent') return task.priority === 'urgent' || task.priority === 'high';
        if (filter === 'completed') return task.status === 'completed';
        return true;
    });

    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length,
        completed: tasks.filter(t => t.status === 'completed').length
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Vertrags-Tasks</h1>
                <p className="text-gray-600 mt-1">Alle automatisch generierten Tasks aus Vertragsanalysen</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-bold">{stats.total}</span>
                        </div>
                        <p className="text-sm text-gray-600">Gesamt</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <span className="text-2xl font-bold">{stats.pending}</span>
                        </div>
                        <p className="text-sm text-gray-600">Offen</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-2xl font-bold">{stats.urgent}</span>
                        </div>
                        <p className="text-sm text-gray-600">Dringend</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold">{stats.completed}</span>
                        </div>
                        <p className="text-sm text-gray-600">Erledigt</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Tasks</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                Alle
                            </Button>
                            <Button
                                variant={filter === 'pending' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('pending')}
                            >
                                Offen
                            </Button>
                            <Button
                                variant={filter === 'urgent' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('urgent')}
                            >
                                Dringend
                            </Button>
                            <Button
                                variant={filter === 'completed' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('completed')}
                            >
                                Erledigt
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Lädt...</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Keine Tasks gefunden
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {STATUS_ICONS[task.status]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-semibold">{task.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                </div>
                                                <Badge className={PRIORITY_COLORS[task.priority]}>
                                                    {task.priority}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                                                {task.due_date && (
                                                    <span>📅 Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}</span>
                                                )}
                                                {task.category && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {task.category}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-3">
                                                {task.status !== 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateTaskStatus(task.id, 'completed')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Erledigt
                                                    </Button>
                                                )}
                                                {task.status === 'todo' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                                    >
                                                        In Bearbeitung
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}