import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function WorkflowStepsEditor({ open, onOpenChange, workflow }) {
    const queryClient = useQueryClient();
    const [localSteps, setLocalSteps] = useState([]);

    const { data: steps = [], isLoading } = useQuery({
        queryKey: ['workflowSteps', workflow?.id],
        queryFn: async () => {
            if (!workflow?.id) return [];
            return await base44.entities.WorkflowStep.filter({ workflow_id: workflow.id });
        },
        enabled: !!workflow?.id
    });

    React.useEffect(() => {
        if (steps.length > 0) {
            setLocalSteps([...steps].sort((a, b) => a.step_order - b.step_order));
        } else if (workflow) {
            setLocalSteps([]);
        }
    }, [steps, workflow]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.WorkflowStep.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.WorkflowStep.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.WorkflowStep.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
        }
    });

    const handleAddStep = () => {
        const newStep = {
            workflow_id: workflow.id,
            step_order: localSteps.length + 1,
            step_name: '',
            action_type: 'create_document',
            action_config: {},
            next_step_delay_days: 0,
            is_automated: false,
            isNew: true
        };
        setLocalSteps([...localSteps, newStep]);
    };

    const handleUpdateStep = (index, field, value) => {
        const updated = [...localSteps];
        updated[index] = { ...updated[index], [field]: value };
        setLocalSteps(updated);
    };

    const handleDeleteStep = (index) => {
        const step = localSteps[index];
        if (step.id) {
            deleteMutation.mutate(step.id);
        }
        const updated = localSteps.filter((_, i) => i !== index);
        setLocalSteps(updated.map((s, i) => ({ ...s, step_order: i + 1 })));
    };

    const handleSaveAll = async () => {
        for (const step of localSteps) {
            if (step.isNew && step.step_name) {
                const { isNew, ...stepData } = step;
                await createMutation.mutateAsync(stepData);
            } else if (step.id) {
                const { id, ...stepData } = step;
                await updateMutation.mutateAsync({ id, data: stepData });
            }
        }
        onOpenChange(false);
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(localSteps);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const reordered = items.map((item, index) => ({
            ...item,
            step_order: index + 1
        }));

        setLocalSteps(reordered);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Workflow-Schritte: {workflow?.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="steps">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                    {localSteps.map((step, index) => (
                                        <Draggable key={index} draggableId={`step-${index}`} index={index}>
                                            {(provided) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div {...provided.dragHandleProps} className="mt-2">
                                                                <GripVertical className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
                                                                        {step.step_order}
                                                                    </div>
                                                                    <Input
                                                                        value={step.step_name}
                                                                        onChange={(e) => handleUpdateStep(index, 'step_name', e.target.value)}
                                                                        placeholder="Schritt-Name"
                                                                        className="flex-1"
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteStep(index)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <Label className="text-xs">Aktion</Label>
                                                                        <select
                                                                            value={step.action_type}
                                                                            onChange={(e) => handleUpdateStep(index, 'action_type', e.target.value)}
                                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                        >
                                                                            <option value="create_document">Dokument erstellen</option>
                                                                            <option value="send_email">Email versenden</option>
                                                                            <option value="create_task">Task erstellen</option>
                                                                            <option value="update_status">Status ändern</option>
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <Label className="text-xs">Verzögerung (Tage)</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={step.next_step_delay_days}
                                                                            onChange={(e) => handleUpdateStep(index, 'next_step_delay_days', parseInt(e.target.value) || 0)}
                                                                            className="h-9"
                                                                            min="0"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs">Bedingung (optional)</Label>
                                                                    <Input
                                                                        value={step.next_step_condition || ''}
                                                                        onChange={(e) => handleUpdateStep(index, 'next_step_condition', e.target.value)}
                                                                        placeholder="z.B. status == 'versendet'"
                                                                        className="h-9"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`automated-${index}`}
                                                                        checked={step.is_automated}
                                                                        onCheckedChange={(checked) => handleUpdateStep(index, 'is_automated', checked)}
                                                                    />
                                                                    <label
                                                                        htmlFor={`automated-${index}`}
                                                                        className="text-sm font-medium leading-none"
                                                                    >
                                                                        Automatisch ausführen
                                                                    </label>
                                                                </div>
                                                            </div>
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
                    </DragDropContext>

                    {localSteps.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-slate-500 mb-4">Noch keine Schritte definiert</p>
                                <Button onClick={handleAddStep} variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ersten Schritt hinzufügen
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {localSteps.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddStep}
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Schritt hinzufügen
                        </Button>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={isLoading || createMutation.isPending || updateMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {(isLoading || createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Speichern
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}