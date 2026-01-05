import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import OwnerSelectDialog from './OwnerSelectDialog';

export default function ShareholderManager({ ownerId, ownerName }) {
    const [selectDialogOpen, setSelectDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: shareholders = [] } = useQuery({
        queryKey: ['shareholders', ownerId],
        queryFn: () => base44.entities.Shareholder.filter({ owner_id: ownerId }),
        enabled: !!ownerId
    });

    const { data: allOwners = [], isLoading: ownersLoading } = useQuery({
        queryKey: ['owners'],
        queryFn: async () => {
            try {
                return await base44.entities.Owner.list();
            } catch (error) {
                console.error('Error loading owners:', error);
                toast.error('Fehler beim Laden der Eigentümer');
                return [];
            }
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Shareholder.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Gesellschafter hinzugefügt');
            setSelectDialogOpen(false);
        },
        onError: (error) => {
            console.error('Error creating shareholder:', error);
            toast.error('Fehler beim Hinzufügen: ' + (error.message || 'Unbekannter Fehler'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Shareholder.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Gesellschafter aktualisiert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Shareholder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Gesellschafter entfernt');
        }
    });

    const handleAddShareholder = (selectedOwnerId) => {
        if (!selectedOwnerId) {
            toast.error('Bitte wählen Sie einen Eigentümer aus');
            return;
        }
        
        createMutation.mutate({
            owner_id: ownerId,
            gesellschafter_owner_id: selectedOwnerId,
            anteil_prozent: 0,
            gueltig_von: new Date().toISOString().split('T')[0]
        });
    };

    const handleUpdateField = (shareholderId, field, value) => {
        const shareholder = shareholders.find(s => s.id === shareholderId);
        updateMutation.mutate({
            id: shareholderId,
            data: { ...shareholder, [field]: value }
        });
    };

    const getOwnerById = (id) => allOwners.find(o => o.id === id);

    const totalPercentage = shareholders.reduce((sum, s) => sum + (s.anteil_prozent || 0), 0);
    const isValid = Math.abs(totalPercentage - 100) < 0.01;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Gesellschafter</h3>
                    <p className="text-sm text-slate-600">von {ownerName}</p>
                </div>
                <Button 
                    onClick={() => setSelectDialogOpen(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Gesellschafter hinzufügen
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
                {shareholders.map((shareholder) => {
                    const shareholderOwner = getOwnerById(shareholder.gesellschafter_owner_id);
                    return (
                        <Card key={shareholder.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {shareholderOwner?.vorname} {shareholderOwner?.nachname}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {shareholderOwner?.eigentuemer_typ === 'natuerliche_person' 
                                                ? 'Natürliche Person' 
                                                : shareholderOwner?.eigentuemer_typ?.toUpperCase()}
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
                    );
                })}

                {shareholders.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-500">Noch keine Gesellschafter hinzugefügt</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectDialogOpen(true)}
                                className="mt-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Ersten Gesellschafter hinzufügen
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {selectDialogOpen && (
                <OwnerSelectDialog
                    open={selectDialogOpen}
                    onOpenChange={setSelectDialogOpen}
                    onSelect={handleAddShareholder}
                    excludeIds={[ownerId, ...shareholders.map(s => s.gesellschafter_owner_id)]}
                />
            )}
        </div>
    );
}