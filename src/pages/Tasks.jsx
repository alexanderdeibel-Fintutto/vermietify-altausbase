import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Plus,
    Filter,
    Calendar,
    ListTodo,
    Mail,
    Settings
} from 'lucide-react';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';
import TaskStats from '@/components/tasks/TaskStats';
import WorkflowManager from '@/components/tasks/WorkflowManager';
import AutomationManager from '@/components/tasks/AutomationManager';

export default function Tasks() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list('-created_date')
    });

    const { data: priorities = [] } = useQuery({
        queryKey: ['taskPriorities'],
        queryFn: () => base44.entities.TaskPriority.list('sort_order')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Task.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setFormOpen(false);
            setEditingTask(null);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setFormOpen(false);
            setEditingTask(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Task.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const handleSubmit = (data) => {
        if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Möchten Sie diesen Task wirklich löschen?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddNew = () => {
        setEditingTask(null);
        setFormOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Aufgaben</h1>
                    <p className="text-slate-500">Verwalten Sie alle Tasks und Workflows</p>
                </div>
                <Button 
                    onClick={handleAddNew}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Task
                </Button>
            </div>

            {/* Statistics */}
            <TaskStats tasks={tasks} />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4" />
                        Übersicht
                    </TabsTrigger>
                    <TabsTrigger value="emails" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Emails
                    </TabsTrigger>
                    <TabsTrigger value="workflows" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Workflows
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Regeln
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <TaskList 
                        tasks={tasks}
                        priorities={priorities}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="emails" className="mt-6">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Email-Integration</h3>
                            <p className="text-slate-600 mb-4">Wird in Phase 3 implementiert</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="workflows" className="mt-6">
                    <WorkflowManager />
                </TabsContent>

                <TabsContent value="rules" className="mt-6">
                    <AutomationManager />
                </TabsContent>
            </Tabs>

            {/* Task Form Dialog */}
            <TaskForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingTask}
                priorities={priorities}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}