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
    Settings,
    Activity
} from 'lucide-react';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';
import TaskStats from '@/components/tasks/TaskStats';
import WorkflowManager from '@/components/tasks/WorkflowManager';
import AutomationManager from '@/components/tasks/AutomationManager';
import EmailAccountManager from '@/components/tasks/EmailAccountManager';
import EmailList from '@/components/tasks/EmailList';
import TaskDashboard from '@/components/tasks/TaskDashboard';
import TaskKanban from '@/components/tasks/TaskKanban';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import ActivityLogViewer from '@/components/tasks/ActivityLogViewer';
import PerformanceMonitor from '@/components/tasks/PerformanceMonitor';
import SetupWizard from '@/components/tasks/SetupWizard';

export default function Tasks() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [setupWizardOpen, setSetupWizardOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list('-created_date')
    });

    const { data: priorities = [] } = useQuery({
        queryKey: ['taskPriorities'],
        queryFn: () => base44.entities.TaskPriority.list('sort_order')
    });

    // Setup-Wizard beim ersten Start anzeigen
    React.useEffect(() => {
        const checkSetup = async () => {
            const workflows = await base44.entities.Workflow.list();
            if (workflows.length === 0) {
                setSetupWizardOpen(true);
            }
        };
        checkSetup();
    }, []);

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

            {/* Performance Monitor */}
            <PerformanceMonitor />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-8">
                    <TabsTrigger value="overview">Übersicht</TabsTrigger>
                    <TabsTrigger value="tasks">Liste</TabsTrigger>
                    <TabsTrigger value="kanban">Kanban</TabsTrigger>
                    <TabsTrigger value="calendar">Kalender</TabsTrigger>
                    <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    <TabsTrigger value="emails">Emails</TabsTrigger>
                    <TabsTrigger value="rules">Regeln</TabsTrigger>
                    <TabsTrigger value="logs">Protokoll</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <TaskDashboard />
                </TabsContent>

                <TabsContent value="tasks" className="mt-6">
                    <TaskList 
                        tasks={tasks}
                        priorities={priorities}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="kanban" className="mt-6">
                    <TaskKanban 
                        tasks={tasks}
                        priorities={priorities}
                        onEdit={handleEdit}
                    />
                </TabsContent>

                <TabsContent value="calendar" className="mt-6">
                    <TaskCalendar 
                        tasks={tasks}
                        priorities={priorities}
                        onTaskClick={handleEdit}
                    />
                </TabsContent>

                <TabsContent value="workflows" className="mt-6">
                    <WorkflowManager />
                </TabsContent>

                <TabsContent value="emails" className="mt-6">
                    <div className="space-y-6">
                        <EmailAccountManager />
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">Empfangene Emails</h2>
                            <EmailList onCreateTask={(data) => {
                                setFormOpen(true);
                            }} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="rules" className="mt-6">
                    <AutomationManager />
                </TabsContent>

                <TabsContent value="logs" className="mt-6">
                    <ActivityLogViewer entityType="task" />
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

                {/* Setup Wizard */}
                <SetupWizard
                open={setupWizardOpen}
                onComplete={() => {
                    setSetupWizardOpen(false);
                    queryClient.invalidateQueries();
                }}
                />
                </div>
                );
                }