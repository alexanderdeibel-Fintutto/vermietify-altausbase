import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useActivityLogger } from './useActivityLogger';

export default function TaskForm({ open, onOpenChange, onSubmit, initialData, priorities, isLoading }) {
    const [suggestedWorkflow, setSuggestedWorkflow] = useState(null);
    const [loadingWorkflow, setLoadingWorkflow] = useState(false);
    const { logActivity } = useActivityLogger();

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: workflows = [] } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => base44.entities.Workflow.list()
    });

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: initialData || {
            status: 'offen'
        }
    });

    const title = watch('title');
    const description = watch('description');

    useEffect(() => {
        if (open) {
            reset(initialData || { status: 'offen' });
            setSuggestedWorkflow(null);
        }
    }, [open, initialData, reset]);

    // KI-Workflow-Vorschlag
    useEffect(() => {
        const getSuggestion = async () => {
            if (!open || initialData || !title || title.length < 5) return;
            
            setLoadingWorkflow(true);
            try {
                const response = await base44.functions.invoke('suggestWorkflow', {
                    task_title: title,
                    task_description: description || ''
                });
                
                if (response.data.suggested_workflow && response.data.confidence > 60) {
                    setSuggestedWorkflow(response.data);
                    toast.info('Workflow-Vorschlag verfügbar', {
                        description: response.data.reasoning
                    });
                }
            } catch (error) {
                console.error('Workflow suggestion failed:', error);
            } finally {
                setLoadingWorkflow(false);
            }
        };

        const timer = setTimeout(getSuggestion, 1000);
        return () => clearTimeout(timer);
    }, [title, description, open, initialData]);

    const handleFormSubmit = async (data) => {
        const taskData = {
            ...data,
            due_date: data.due_date || null,
            completed_at: data.status === 'erledigt' && !initialData?.completed_at ? new Date().toISOString() : initialData?.completed_at
        };

        // Activity Logging
        await logActivity(
            initialData ? 'task_aktualisiert' : 'task_erstellt',
            'task',
            initialData?.id || null,
            initialData || null,
            taskData
        );

        // Notification erstellen bei neuem Task
        if (!initialData) {
            try {
                await base44.functions.invoke('createNotification', {
                    title: 'Neuer Task erstellt',
                    message: `Task "${data.title}" wurde erfolgreich erstellt`,
                    type: 'success',
                    entity_type: 'task'
                });
            } catch (error) {
                console.error('Notification failed:', error);
            }
        }

        onSubmit(taskData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Task bearbeiten' : 'Neuer Task'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="title">Titel *</Label>
                        <Input
                            id="title"
                            {...register('title', { required: true })}
                            placeholder="Task-Titel"
                            className={errors.title ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Detaillierte Beschreibung..."
                            rows={4}
                        />
                    </div>

                    {/* KI-Workflow-Vorschlag */}
                        {suggestedWorkflow && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900 mb-1">
                                            KI-Empfehlung: {suggestedWorkflow.suggested_workflow?.name}
                                        </h4>
                                        <p className="text-sm text-blue-700 mb-3">
                                            {suggestedWorkflow.reasoning}
                                        </p>
                                        <Badge className="bg-blue-600">
                                            {suggestedWorkflow.confidence}% Übereinstimmung
                                        </Badge>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="ml-2"
                                            onClick={() => {
                                                setValue('workflow_id', suggestedWorkflow.suggested_workflow.id);
                                                toast.success('Workflow übernommen');
                                                setSuggestedWorkflow(null);
                                            }}
                                        >
                                            Übernehmen
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                {...register('status')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="offen">Offen</option>
                                <option value="in_bearbeitung">In Bearbeitung</option>
                                <option value="wartend">Wartend</option>
                                <option value="erledigt">Erledigt</option>
                                <option value="abgebrochen">Abgebrochen</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="priority_id">Priorität</Label>
                            <select
                                id="priority_id"
                                {...register('priority_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Keine</option>
                                {priorities.map(priority => (
                                    <option key={priority.id} value={priority.id}>
                                        {priority.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="due_date">Fälligkeitsdatum</Label>
                            <Input
                                id="due_date"
                                type="datetime-local"
                                {...register('due_date')}
                            />
                        </div>

                        <div>
                            <Label htmlFor="workflow_id">Workflow</Label>
                            <select
                                id="workflow_id"
                                {...register('workflow_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Kein Workflow</option>
                                {workflows.map(workflow => (
                                    <option key={workflow.id} value={workflow.id}>
                                        {workflow.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="next_action">Nächste Aktion</Label>
                            <Input
                                id="next_action"
                                {...register('next_action')}
                                placeholder="z.B. Dokument erstellen"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="assigned_object_id">Zugeordnetes Objekt</Label>
                            <select
                                id="assigned_object_id"
                                {...register('assigned_object_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Kein Objekt</option>
                                {buildings.map(building => (
                                    <option key={building.id} value={building.id}>
                                        {building.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="assigned_tenant_id">Zugeordneter Mieter</Label>
                            <select
                                id="assigned_tenant_id"
                                {...register('assigned_tenant_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Kein Mieter</option>
                                {tenants.map(tenant => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.first_name} {tenant.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}