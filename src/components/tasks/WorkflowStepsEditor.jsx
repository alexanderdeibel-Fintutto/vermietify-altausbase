import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
    Plus, 
    Edit, 
    Trash2, 
    GripVertical,
    FileText,
    Mail,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function WorkflowStepsEditor({ workflowId, workflowName }) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const queryClient = useQueryClient();

    const { data: steps = [], isLoading } = useQuery({
        queryKey: ['workflowSteps', workflowId],
        queryFn: async () => {
            const allSteps = await base44.entities.WorkflowStep.filter({ 
                workflow_id: workflowId 
            });
            return allSteps.sort((a, b) => a.step_order - b.step_order);
        },
        enabled: !!workflowId
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.WorkflowStep.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
            setFormOpen(false);
            setEditingStep(null);
            toast.success('Schritt erstellt');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.WorkflowStep.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
            setFormOpen(false);
            setEditingStep(null);
            toast.success('Schritt aktualisiert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.WorkflowStep.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
            toast.success('Schritt gelöscht');
        }
    });

    const getActionIcon = (actionType) => {
        switch (actionType) {
            case 'create_document': return FileText;
            case 'send_email': return Mail;
            case 'create_task': return CheckCircle;
            case 'update_status': return RefreshCw;
            default: return FileText;
        }
    };

    const getActionLabel = (actionType) => {
        const labels = {
            'create_document': 'Dokument erstellen',
            'send_email': 'Email senden',
            'create_task': 'Task erstellen',
            'update_status': 'Status aktualisieren'
        };
        return labels[actionType] || actionType;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                        Workflow-Schritte: {workflowName}
                    </h3>
                    <p className="text-sm text-slate-600">
                        {steps.length} Schritt{steps.length !== 1 ? 'e' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingStep(null);
                        setFormOpen(true);
                    }}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Schritt hinzufügen
                </Button>
            </div>

            {steps.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-slate-500 mb-4">Noch keine Schritte definiert</p>
                        <Button onClick={() => setFormOpen(true)} variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Ersten Schritt hinzufügen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const Icon = getActionIcon(step.action_type);
                        return (
                            <Card key={step.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="w-5 h-5 text-slate-400" />
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                                                {step.step_order}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className="w-4 h-4 text-slate-600" />
                                                <h4 className="font-semibold text-slate-800">
                                                    {step.step_name}
                                                </h4>
                                                <Badge variant="outline">
                                                    {getActionLabel(step.action_type)}
                                                </Badge>
                                                {step.is_automated && (
                                                    <Badge className="bg-blue-100 text-blue-700">
                                                        Automatisch
                                                    </Badge>
                                                )}
                                            </div>
                                            {step.next_step_delay_days > 0 && (
                                                <p className="text-sm text-slate-600">
                                                    Verzögerung: {step.next_step_delay_days} Tag{step.next_step_delay_days !== 1 ? 'e' : ''}
                                                </p>
                                            )}
                                            {step.next_step_condition && (
                                                <p className="text-sm text-slate-600">
                                                    Bedingung: {step.next_step_condition}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingStep(step);
                                                    setFormOpen(true);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm('Schritt löschen?')) {
                                                        deleteMutation.mutate(step.id);
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <StepForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={(data) => {
                    const stepData = {
                        ...data,
                        workflow_id: workflowId,
                        step_order: editingStep ? editingStep.step_order : steps.length + 1,
                        action_config: typeof data.action_config === 'string' 
                            ? JSON.parse(data.action_config || '{}') 
                            : data.action_config
                    };
                    
                    if (editingStep) {
                        updateMutation.mutate({ id: editingStep.id, data: stepData });
                    } else {
                        createMutation.mutate(stepData);
                    }
                }}
                initialData={editingStep}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}

function StepForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const [formData, setFormData] = useState(initialData || {
        step_name: '',
        action_type: 'create_document',
        action_config: {},
        next_step_delay_days: 0,
        is_automated: false
    });

    React.useEffect(() => {
        if (open) {
            setFormData(initialData || {
                step_name: '',
                action_type: 'create_document',
                action_config: {},
                next_step_delay_days: 0,
                is_automated: false
            });
        }
    }, [open, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Schritt bearbeiten' : 'Neuer Schritt'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label>Schritt-Name *</Label>
                        <Input
                            value={formData.step_name}
                            onChange={(e) => setFormData({ ...formData, step_name: e.target.value })}
                            placeholder="z.B. Mahnung erstellen"
                            required
                        />
                    </div>

                    <div>
                        <Label>Aktionstyp *</Label>
                        <select
                            value={formData.action_type}
                            onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="create_document">Dokument erstellen</option>
                            <option value="send_email">Email senden</option>
                            <option value="create_task">Task erstellen</option>
                            <option value="update_status">Status aktualisieren</option>
                        </select>
                    </div>

                    <div>
                        <Label>Aktions-Konfiguration (JSON)</Label>
                        <Textarea
                            value={typeof formData.action_config === 'object' 
                                ? JSON.stringify(formData.action_config, null, 2) 
                                : formData.action_config}
                            onChange={(e) => setFormData({ ...formData, action_config: e.target.value })}
                            placeholder='{"template": "Mahnung 1"}'
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label>Verzögerung (Tage)</Label>
                        <Input
                            type="number"
                            value={formData.next_step_delay_days}
                            onChange={(e) => setFormData({ ...formData, next_step_delay_days: parseInt(e.target.value) || 0 })}
                            min="0"
                        />
                    </div>

                    <div>
                        <Label>Bedingung für nächsten Schritt</Label>
                        <Input
                            value={formData.next_step_condition || ''}
                            onChange={(e) => setFormData({ ...formData, next_step_condition: e.target.value })}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <Label>Automatisch ausführen</Label>
                        <Switch
                            checked={formData.is_automated}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_automated: checked })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                            {initialData ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}