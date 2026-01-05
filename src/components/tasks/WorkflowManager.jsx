import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Copy, Settings } from 'lucide-react';
import WorkflowForm from './WorkflowForm';
import WorkflowStepsEditor from './WorkflowStepsEditor';

export default function WorkflowManager() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [stepsEditorOpen, setStepsEditorOpen] = useState(false);
    const [editingStepsWorkflow, setEditingStepsWorkflow] = useState(null);
    const queryClient = useQueryClient();

    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => base44.entities.Workflow.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Workflow.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Workflow.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            setFormOpen(false);
            setEditingWorkflow(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Workflow.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
    });

    const duplicateMutation = useMutation({
        mutationFn: async (workflow) => {
            const newWorkflow = await base44.entities.Workflow.create({
                ...workflow,
                name: `${workflow.name} (Kopie)`,
                is_default: false
            });
            return newWorkflow;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
    });

    const handleSubmit = (data) => {
        if (editingWorkflow) {
            updateMutation.mutate({ id: editingWorkflow.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (workflow) => {
        setEditingWorkflow(workflow);
        setFormOpen(true);
    };

    const handleEditSteps = (workflow) => {
        setEditingStepsWorkflow(workflow);
        setStepsEditorOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Möchten Sie diesen Workflow wirklich löschen?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleDuplicate = (workflow) => {
        duplicateMutation.mutate(workflow);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Workflows</h2>
                    <p className="text-sm text-slate-600">Automatisierte Prozesse für Dokumenttypen</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingWorkflow(null);
                        setFormOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Workflow
                </Button>
            </div>

            {workflows.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Workflows</h3>
                        <p className="text-slate-600 mb-4">Erstellen Sie Ihren ersten Workflow</p>
                        <Button onClick={() => setFormOpen(true)} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Ersten Workflow anlegen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workflows.map((workflow) => (
                        <Card key={workflow.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-lg">{workflow.name}</CardTitle>
                                            {workflow.is_default && (
                                                <Badge className="bg-emerald-100 text-emerald-700">
                                                    Standard
                                                </Badge>
                                            )}
                                            {!workflow.is_active && (
                                                <Badge variant="outline" className="text-slate-500">
                                                    Inaktiv
                                                </Badge>
                                            )}
                                        </div>
                                        {workflow.document_type && (
                                            <Badge variant="outline" className="text-xs">
                                                {workflow.document_type}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {workflow.description && (
                                    <p className="text-sm text-slate-600 mb-4">{workflow.description}</p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditSteps(workflow)}
                                        className="flex-1"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Schritte
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(workflow)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDuplicate(workflow)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(workflow.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <WorkflowForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingWorkflow}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            {editingStepsWorkflow && (
                <WorkflowStepsEditor
                    open={stepsEditorOpen}
                    onOpenChange={setStepsEditorOpen}
                    workflow={editingStepsWorkflow}
                />
            )}
        </div>
    );
}