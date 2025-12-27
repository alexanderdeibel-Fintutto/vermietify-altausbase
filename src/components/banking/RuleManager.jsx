import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function RuleManager({ categoryLabels, open, onOpenChange }) {
    const [editingRule, setEditingRule] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();

    const { data: rules = [] } = useQuery({
        queryKey: ['categorization-rules'],
        queryFn: () => base44.entities.CategorizationRule.list('-priority')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.CategorizationRule.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorization-rules'] });
            setShowForm(false);
            toast.success('Regel erstellt');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.CategorizationRule.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorization-rules'] });
            setShowForm(false);
            setEditingRule(null);
            toast.success('Regel aktualisiert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.CategorizationRule.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorization-rules'] });
            toast.success('Regel gelöscht');
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Kategorisierungsregeln verwalten</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {!showForm && (
                        <Button 
                            onClick={() => {
                                setEditingRule(null);
                                setShowForm(true);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Neue Regel erstellen
                        </Button>
                    )}

                    {showForm ? (
                        <RuleFormContent
                            rule={editingRule}
                            onSubmit={(data) => {
                                if (editingRule) {
                                    updateMutation.mutate({ id: editingRule.id, data });
                                } else {
                                    createMutation.mutate(data);
                                }
                            }}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingRule(null);
                            }}
                            categoryLabels={categoryLabels}
                        />
                    ) : rules.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Noch keine Regeln definiert
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.map(rule => (
                                <Card key={rule.id} className="border-slate-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-slate-800">{rule.name}</h4>
                                                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                                                        {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                                                    </Badge>
                                                    {rule.auto_apply && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Zap className="w-3 h-3 mr-1" />
                                                            Auto
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="text-sm text-slate-600 space-y-1">
                                                    {rule.conditions?.sender_receiver_contains && (
                                                        <div>Sender enthält: "{rule.conditions.sender_receiver_contains}"</div>
                                                    )}
                                                    {rule.conditions?.description_contains && (
                                                        <div>Beschreibung enthält: "{rule.conditions.description_contains}"</div>
                                                    )}
                                                    {(rule.conditions?.amount_min || rule.conditions?.amount_max) && (
                                                        <div>
                                                            Betrag: {rule.conditions.amount_min ? `€${rule.conditions.amount_min}` : '∞'} 
                                                            {' bis '}
                                                            {rule.conditions.amount_max ? `€${rule.conditions.amount_max}` : '∞'}
                                                        </div>
                                                    )}
                                                    <div className="mt-2">
                                                        → <Badge className="bg-blue-100 text-blue-700">
                                                            {categoryLabels[rule.target_category] || rule.target_category}
                                                        </Badge>
                                                    </div>
                                                    {rule.match_count > 0 && (
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            {rule.match_count}× angewendet
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingRule(rule);
                                                        setShowForm(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteMutation.mutate(rule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function RuleFormContent({ rule, onSubmit, onCancel, categoryLabels }) {
    const [formData, setFormData] = useState(rule || {
        name: '',
        is_active: true,
        priority: 0,
        auto_apply: true,
        conditions: {},
        target_category: '',
        match_count: 0
    });

    React.useEffect(() => {
        if (rule) {
            setFormData(rule);
        } else {
            setFormData({
                name: '',
                is_active: true,
                priority: 0,
                auto_apply: true,
                conditions: {},
                target_category: '',
                match_count: 0
            });
        }
    }, [rule]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Card className="border-2 border-emerald-500">
            <CardHeader>
                <CardTitle>{rule ? 'Regel bearbeiten' : 'Neue Regel'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Regelname *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="z.B. Stadtwerke Strom"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Priorität</Label>
                            <Input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-6">
                            <Label>Automatisch anwenden</Label>
                            <Switch
                                checked={formData.auto_apply}
                                onCheckedChange={(checked) => setFormData({ ...formData, auto_apply: checked })}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Bedingungen</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <Label>Sender/Empfänger enthält</Label>
                                <Input
                                    value={formData.conditions?.sender_receiver_contains || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        conditions: { ...formData.conditions, sender_receiver_contains: e.target.value }
                                    })}
                                    placeholder="z.B. Stadtwerke"
                                />
                            </div>

                            <div>
                                <Label>Beschreibung enthält</Label>
                                <Input
                                    value={formData.conditions?.description_contains || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        conditions: { ...formData.conditions, description_contains: e.target.value }
                                    })}
                                    placeholder="z.B. Stromrechnung"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Betrag von (€)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.conditions?.amount_min || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            conditions: { ...formData.conditions, amount_min: parseFloat(e.target.value) }
                                        })}
                                        placeholder="-1000"
                                    />
                                </div>
                                <div>
                                    <Label>Betrag bis (€)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.conditions?.amount_max || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            conditions: { ...formData.conditions, amount_max: parseFloat(e.target.value) }
                                        })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Zielkategorie *</Label>
                        <Select
                            value={formData.target_category}
                            onValueChange={(value) => setFormData({ ...formData, target_category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kategorie wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categoryLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Abbrechen
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                            {rule ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}