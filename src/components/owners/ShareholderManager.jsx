import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareholderManager({ ownerId, ownerName }) {
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        gesellschafter_owner_id: '',
        anteil_prozent: '',
        gueltig_von: new Date().toISOString().split('T')[0],
        bemerkungen: ''
    });
    const queryClient = useQueryClient();

    const { data: shareholders = [], isLoading } = useQuery({
        queryKey: ['shareholders', ownerId],
        queryFn: async () => {
            if (!ownerId) return [];
            const result = await base44.entities.Shareholder.filter({ owner_id: ownerId });
            return result || [];
        },
        enabled: !!ownerId,
        retry: false
    });

    const { data: allOwners = [] } = useQuery({
        queryKey: ['owners'],
        queryFn: async () => {
            const result = await base44.entities.Owner.list();
            return result || [];
        },
        retry: false
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            try {
                return await base44.entities.Shareholder.create(data);
            } catch (error) {
                console.error('Create shareholder error:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Gesellschafter hinzugefügt');
            setShowDialog(false);
            setFormData({
                gesellschafter_owner_id: '',
                anteil_prozent: '',
                gueltig_von: new Date().toISOString().split('T')[0],
                bemerkungen: ''
            });
        },
        onError: (error) => {
            console.error('Mutation error:', error);
            toast.error('Fehler: ' + (error.message || 'Unbekannt'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Shareholder.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Aktualisiert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Shareholder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Entfernt');
        }
    });

    if (!ownerId) return null;

    const handleSave = () => {
        if (!formData.gesellschafter_owner_id) {
            toast.error('Bitte Gesellschafter auswählen');
            return;
        }
        if (!formData.anteil_prozent || parseFloat(formData.anteil_prozent) <= 0) {
            toast.error('Bitte Anteil in % angeben');
            return;
        }
        try {
            createMutation.mutate({
                owner_id: ownerId,
                gesellschafter_owner_id: formData.gesellschafter_owner_id,
                anteil_prozent: parseFloat(formData.anteil_prozent),
                gueltig_von: formData.gueltig_von,
                bemerkungen: formData.bemerkungen || ''
            });
        } catch (error) {
            console.error('Error saving shareholder:', error);
            toast.error('Fehler beim Speichern: ' + error.message);
        }
    };

    const handleUpdateField = (shareholderId, field, value) => {
        const shareholder = shareholders.find(s => s.id === shareholderId);
        updateMutation.mutate({
            id: shareholderId,
            data: { ...shareholder, [field]: value }
        });
    };

    const getOwnerName = (id) => {
        const owner = allOwners.find(o => o.id === id);
        if (!owner) return 'Unbekannt';
        if (owner.eigentuemer_typ === 'natuerliche_person') {
            return `${owner.vorname || ''} ${owner.nachname}`.trim();
        }
        return owner.nachname;
    };

    const totalPercentage = shareholders.reduce((sum, s) => sum + (s.anteil_prozent || 0), 0);
    const isValid = Math.abs(totalPercentage - 100) < 0.01;

    // Verfügbare Eigentümer (außer dem aktuellen)
    const availableOwners = allOwners.filter(o => o.id !== ownerId);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Gesellschafter</h3>
                    <p className="text-sm text-slate-600">von {ownerName}</p>
                </div>
                <Button 
                    onClick={() => setShowDialog(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Hinzufügen
                </Button>
            </div>

            {!isValid && shareholders.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-900">Anteile stimmen nicht überein</p>
                                <p className="text-sm text-amber-700">
                                    Gesamt: {totalPercentage.toFixed(2)}% (sollte 100% sein)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {shareholders.map((shareholder) => (
                    <Card key={shareholder.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-medium text-slate-800">
                                        {getOwnerName(shareholder.gesellschafter_owner_id)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMutation.mutate(shareholder.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Anteil (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={shareholder.anteil_prozent || 0}
                                        onChange={(e) => handleUpdateField(shareholder.id, 'anteil_prozent', parseFloat(e.target.value))}
                                        className="h-9"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Gültig von</Label>
                                    <Input
                                        type="date"
                                        value={shareholder.gueltig_von || ''}
                                        onChange={(e) => handleUpdateField(shareholder.id, 'gueltig_von', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Gültig bis (optional)</Label>
                                    <Input
                                        type="date"
                                        value={shareholder.gueltig_bis || ''}
                                        onChange={(e) => handleUpdateField(shareholder.id, 'gueltig_bis', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Bemerkungen</Label>
                                    <Input
                                        value={shareholder.bemerkungen || ''}
                                        onChange={(e) => handleUpdateField(shareholder.id, 'bemerkungen', e.target.value)}
                                        placeholder="Optionale Notizen..."
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {shareholders.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-500">Noch keine Gesellschafter</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gesellschafter hinzufügen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Gesellschafter auswählen *</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.gesellschafter_owner_id}
                                onChange={(e) => setFormData({...formData, gesellschafter_owner_id: e.target.value})}
                            >
                                <option value="">-- Auswählen --</option>
                                {availableOwners.map(owner => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.eigentuemer_typ === 'natuerliche_person' 
                                            ? `${owner.vorname || ''} ${owner.nachname}`.trim()
                                            : owner.nachname
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <Label>Anteil (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.anteil_prozent}
                                onChange={(e) => setFormData({...formData, anteil_prozent: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <Label>Gültig von</Label>
                            <Input
                                type="date"
                                value={formData.gueltig_von}
                                onChange={(e) => setFormData({...formData, gueltig_von: e.target.value})}
                            />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowDialog(false)}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={createMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                Speichern
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}