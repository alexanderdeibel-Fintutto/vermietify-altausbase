import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, Building2, User, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TaskKanban({ tasks, priorities, onEdit }) {
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task aktualisiert');
        }
    });

    const columns = [
        { id: 'offen', title: 'Offen', color: 'border-blue-200' },
        { id: 'in_bearbeitung', title: 'In Bearbeitung', color: 'border-yellow-200' },
        { id: 'wartend', title: 'Wartend', color: 'border-purple-200' },
        { id: 'erledigt', title: 'Erledigt', color: 'border-green-200' }
    ];

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const taskId = result.draggableId;
        const newStatus = result.destination.droppableId;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        const updateData = { status: newStatus };
        if (newStatus === 'erledigt' && !task.completed_at) {
            updateData.completed_at = new Date().toISOString();
        }

        updateMutation.mutate({ id: taskId, data: updateData });
    };

    const getPriorityColor = (priorityId) => {
        const priority = priorities.find(p => p.id === priorityId);
        return priority?.color_code || '#6b7280';
    };

    const getPriorityName = (priorityId) => {
        const priority = priorities.find(p => p.id === priorityId);
        return priority?.name || '';
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map((column) => {
                    const columnTasks = tasks.filter(t => t.status === column.id);

                    return (
                        <Card key={column.id} className={`border-t-4 ${column.color}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>{column.title}</span>
                                    <Badge variant="outline">{columnTasks.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`space-y-2 min-h-[200px] ${
                                                snapshot.isDraggingOver ? 'bg-slate-50 rounded-lg' : ''
                                            }`}
                                        >
                                            {columnTasks.map((task, index) => (
                                                <Draggable 
                                                    key={task.id} 
                                                    draggableId={task.id} 
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`cursor-move hover:shadow-md transition-shadow ${
                                                                snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-500' : ''
                                                            }`}
                                                        >
                                                            <CardContent className="p-3">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className="font-semibold text-sm text-slate-800 line-clamp-2">
                                                                            {task.title}
                                                                        </h4>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onEdit(task);
                                                                            }}
                                                                        >
                                                                            <Edit className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>

                                                                    {task.description && (
                                                                        <p className="text-xs text-slate-600 line-clamp-2">
                                                                            {task.description}
                                                                        </p>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-1">
                                                                        {task.priority_id && (
                                                                            <Badge 
                                                                                className="text-xs"
                                                                                style={{ 
                                                                                    backgroundColor: getPriorityColor(task.priority_id) + '20',
                                                                                    color: getPriorityColor(task.priority_id),
                                                                                    borderColor: getPriorityColor(task.priority_id)
                                                                                }}
                                                                            >
                                                                                {getPriorityName(task.priority_id)}
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                            <Calendar className="w-3 h-3" />
                                                                            <span>
                                                                                {format(parseISO(task.due_date), 'dd.MM.', { locale: de })}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </DragDropContext>
    );
}