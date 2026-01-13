import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Zap, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import AutomationForm from './AutomationForm';
import { useActivityLogger } from './useActivityLogger';

export default function AutomationManager() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState(null);
    const queryClient = useQueryClient();
    const { logActivity } = useActivityLogger();

    const { data: automations = [], isLoading } = useQuery({
        queryKey: ['automations'],
        queryFn: () => base44.entities.Automation.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const result = await base44.entities.Automation.create(data);
            await logActivity('automation_erstellt', 'automation', result.id, null, data);
            await base44.functions.invoke('createNotification', {
                title: 'Automatisierung erstellt',
                message: `"${data.name}" wurde erfolgreich erstellt`,
                type: 'success',
                entity_type: 'automation',
                entity_id: result.id
            });
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automations'] });
            setFormOpen(false);
            toast.success('Automatisierung erstellt');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const old = automations.find(a => a.id === id);
            const result = await base44.entities.Automation.update(id, data);
            await logActivity('automation_aktualisiert', 'automation', id, old, data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automations'] });
            setFormOpen(false);
            setEditingAutomation(null);
            toast.success('Automatisierung aktualisiert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await logActivity('automation_gelöscht', 'automation', id);
            return base44.entities.Automation.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automations'] });
            toast.success('Automatisierung gelöscht');
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const result = await base44.entities.Automation.update(id, { is_active: !isActive });
            await logActivity(
                isActive ? 'automation_deaktiviert' : 'automation_aktiviert',
                'automation',
                id
            );
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automations'] });
        }
    });

    const handleSubmit = (data) => {
        if (editingAutomation) {
            updateMutation.mutate({ id: editingAutomation.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (automation) => {
        setEditingAutomation(automation);
        setFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Möchten Sie diese Automatisierung wirklich löschen?')) {
            deleteMutation.mutate(id);
        }
    };

    const getTriggerIcon = (type) => {
        const icons = {
            'time_based': Clock,
            'status_change': Zap,
            'document_action': FileText
        };
        return icons[type] || Zap;
    };

    const getTriggerLabel = (type) => {
        const labels = {
            'time_based': 'Zeitgesteuert',
            'status_change': 'Status-Änderung',
            'document_action': 'Dokument-Aktion'
        };
        return labels[type] || type;
    };

    const getActionLabel = (type) => {
        const labels = {
            'create_task': 'Task erstellen',
            'send_email': 'Email versenden',
            'update_document': 'Dokument aktualisieren'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Automatisierungen</h2>
                    <p className="text-sm text-slate-600">Automatische Aktionen basierend auf Triggern</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            setEditingAutomation(null);
                            setFormOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Automatisierung
                    </Button>
                </div>
            </div>

            {automations.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Automatisierungen</h3>
                        <p className="text-slate-600 mb-4">Erstellen Sie Ihre erste Automatisierung</p>
                        <Button onClick={() => setFormOpen(true)} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Erste Automatisierung anlegen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {automations.map((automation) => {
                        const TriggerIcon = getTriggerIcon(automation.trigger_type);
                        
                        return (
                            <Card key={automation.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <TriggerIcon className="w-5 h-5 text-emerald-600" />
                                                <h3 className="font-semibold text-slate-800">
                                                    {automation.name}
                                                </h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {getTriggerLabel(automation.trigger_type)}
                                                </Badge>
                                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                    {getActionLabel(automation.action_type)}
                                                </Badge>
                                            </div>

                                            {automation.description && (
                                                <p className="text-sm text-slate-600 mb-3">
                                                    {automation.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={automation.is_active}
                                                onCheckedChange={() => 
                                                    toggleMutation.mutate({ 
                                                        id: automation.id, 
                                                        isActive: automation.is_active 
                                                    })
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(automation)}
                                                className="text-slate-600 hover:text-slate-800"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(automation.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

            <AutomationForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingAutomation}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}