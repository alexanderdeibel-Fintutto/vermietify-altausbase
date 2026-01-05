import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Edit, 
    Trash2, 
    Calendar,
    Building2,
    FileText,
    Filter,
    Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TaskList({ tasks, priorities, onEdit, onDelete, isLoading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const getPriorityColor = (priorityId) => {
        const priority = priorities.find(p => p.id === priorityId);
        return priority?.color_code || '#6c757d';
    };

    const getPriorityName = (priorityId) => {
        const priority = priorities.find(p => p.id === priorityId);
        return priority?.name || 'Keine';
    };

    const getStatusColor = (status) => {
        const colors = {
            'offen': 'bg-blue-100 text-blue-800',
            'in_bearbeitung': 'bg-yellow-100 text-yellow-800',
            'wartend': 'bg-gray-100 text-gray-800',
            'erledigt': 'bg-green-100 text-green-800',
            'abgebrochen': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'offen': 'Offen',
            'in_bearbeitung': 'In Bearbeitung',
            'wartend': 'Wartend',
            'erledigt': 'Erledigt',
            'abgebrochen': 'Abgebrochen'
        };
        return labels[status] || status;
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === 'erledigt' || status === 'abgebrochen') return false;
        return new Date(dueDate) < new Date();
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-slate-500">Lade Tasks...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tasks durchsuchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">Alle Status</option>
                            <option value="offen">Offen</option>
                            <option value="in_bearbeitung">In Bearbeitung</option>
                            <option value="wartend">Wartend</option>
                            <option value="erledigt">Erledigt</option>
                            <option value="abgebrochen">Abgebrochen</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Keine Tasks gefunden</h3>
                        <p className="text-slate-600">
                            {searchTerm || statusFilter !== 'all' 
                                ? 'Keine Tasks entsprechen den Filterkriterien' 
                                : 'Erstellen Sie Ihren ersten Task'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getPriorityColor(task.priority_id) }}
                                                title={getPriorityName(task.priority_id)}
                                            />
                                            <h3 className="font-semibold text-slate-800 truncate">
                                                {task.title}
                                            </h3>
                                            <Badge className={getStatusColor(task.status)}>
                                                {getStatusLabel(task.status)}
                                            </Badge>
                                            {isOverdue(task.due_date, task.status) && (
                                                <Badge className="bg-red-100 text-red-800">
                                                    Überfällig
                                                </Badge>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            {task.due_date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {format(parseISO(task.due_date), 'dd.MM.yyyy', { locale: de })}
                                                    </span>
                                                </div>
                                            )}
                                            {task.next_action && (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">Nächste Aktion:</span>
                                                    <span>{task.next_action}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(task)}
                                            className="text-slate-600 hover:text-slate-800"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(task.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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