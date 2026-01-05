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
    const [creatingNewShareholder, setCreatingNewShareholder] = useState(false);
    const [newShareholderData, setNewShareholderData] = useState({
        vorname: '',
        nachname: '',
        eigentuemer_typ: 'natuerliche_person',
        anteil_prozent: 0,
        gueltig_von: new Date().toISOString().split('T')[0]
    });
    const queryClient = useQueryClient();

    const { data: shareholders = [] } = useQuery({
        queryKey: ['shareholders', ownerId],
        queryFn: () => base44.entities.Shareholder.filter({ owner_id: ownerId }),
        enabled: !!ownerId
    });

    const { data: allOwners = [] } = useQuery({
        queryKey: ['owners'],
        queryFn: async () => {
            try {
                return await base44.entities.Owner.list();
            } catch (error) {
                console.error('Error loading owners:', error);
                return [];
            }
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Shareholder.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders', ownerId] });
            toast.success('Gesellschafter hinzugefügt');
            setCreatingNewShareholder(false);
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

    const createOwnerMutation = useMutation({
        mutationFn: (data) => base44.entities.Owner.create(data),
        onSuccess: async (response) => {
            const createdOwnerId = response?.id || response;
            await queryClient.invalidateQueries({ queryKey: ['owners'] });
            
            // Jetzt Shareholder erstellen
            createMutation.mutate({
                owner_id: ownerId,
                gesellschafter_owner_id: createdOwnerId,
                anteil_prozent: newShareholderData.anteil_prozent,
                gueltig_von: newShareholderData.gueltig_von
            });
        },
        onError: (error) => {
            console.error('Error creating owner:', error);
            toast.error('Fehler beim Erstellen des Eigentümers');
            setCreatingNewShareholder(false);
        }
    });

    const handleSaveNewShareholder = () => {
        if (!newShareholderData.nachname) {
            toast.error('Bitte mindestens einen Namen eingeben');
            return;
        }
        
        createOwnerMutation.mutate({
            eigentuemer_typ: newShareholderData.eigentuemer_typ,
            vorname: newShareholderData.vorname,
            nachname: newShareholderData.nachname,
            staatsangehoerigkeit: 'deutsch',
            land: 'Deutschland',
            steuerliche_ansaessigkeit: 'inland',
            aktiv: true
        });
    };

    const handleUpdateField = (shareholderId, field, value) => {
        const shareholder = shareholders.find(s => s.id === shareholderId);
        updateMutation.mutate({
            id: shareholderId,
            data: { ...shareholder, [field]: value }
        });
    };

    const getOwnerById = (id) => {
        if (!allOwners || allOwners.length === 0) return null;
        return allOwners.find(o => o.id === id);
    };

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
                    onClick={() => setCreatingNewShareholder(true)}
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
                    const displayName = shareholderOwner 
                        ? `${shareholderOwner.vorname || ''} ${shareholderOwner.nachname || ''}`.trim() || 'Unbekannt'
                        : 'Wird geladen...';
                    const ownerType = shareholderOwner?.eigentuemer_typ === 'natuerliche_person' 
                        ? 'Natürliche Person' 
                        : shareholderOwner?.eigentuemer_typ?.toUpperCase() || '';

                    return (
                        <Card key={shareholder.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {displayName}
                                        </p>
                                        {ownerType && (
                                            <p className="text-sm text-slate-500">
                                                {ownerType}
                                            </p>
                                        )}
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
                                onClick={() => setCreatingNewShareholder(true)}
                                className="mt-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Ersten Gesellschafter hinzufügen
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={creatingNewShareholder} onOpenChange={setCreatingNewShareholder}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Neuer Gesellschafter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Typ</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newShareholderData.eigentuemer_typ}
                                onChange={(e) => setNewShareholderData({...newShareholderData, eigentuemer_typ: e.target.value})}
                            >
                                <option value="natuerliche_person">Natürliche Person</option>
                                <option value="gbr">GbR</option>
                                <option value="gmbh">GmbH</option>
                                <option value="ug">UG</option>
                            </select>
                        </div>
                        
                        {newShareholderData.eigentuemer_typ === 'natuerliche_person' && (
                            <div>
                                <Label>Vorname</Label>
                                <Input
                                    value={newShareholderData.vorname}
                                    onChange={(e) => setNewShareholderData({...newShareholderData, vorname: e.target.value})}
                                />
                            </div>
                        )}
                        
                        <div>
                            <Label>{newShareholderData.eigentuemer_typ === 'natuerliche_person' ? 'Nachname' : 'Firmenname'} *</Label>
                            <Input
                                value={newShareholderData.nachname}
                                onChange={(e) => setNewShareholderData({...newShareholderData, nachname: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div>
                            <Label>Anteil (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={newShareholderData.anteil_prozent}
                                onChange={(e) => setNewShareholderData({...newShareholderData, anteil_prozent: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                        
                        <div>
                            <Label>Gültig von</Label>
                            <Input
                                type="date"
                                value={newShareholderData.gueltig_von}
                                onChange={(e) => setNewShareholderData({...newShareholderData, gueltig_von: e.target.value})}
                            />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCreatingNewShareholder(false)}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                onClick={handleSaveNewShareholder}
                                disabled={createOwnerMutation.isPending || createMutation.isPending}
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