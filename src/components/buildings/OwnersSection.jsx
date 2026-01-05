import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Trash2, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import SimpleOwnerForm from '../owners/SimpleOwnerForm';
import SimpleShareholderForm from '../owners/SimpleShareholderForm';

export default function OwnersSection({ buildingId }) {
    const [addingOwners, setAddingOwners] = useState(false);
    const [addingShareholdersFor, setAddingShareholdersFor] = useState(null);
    const [editingOwner, setEditingOwner] = useState(null);
    const [editingShareholdersFor, setEditingShareholdersFor] = useState(null);
    const queryClient = useQueryClient();

    const { data: building } = useQuery({
        queryKey: ['building', buildingId],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: buildingId });
            return buildings[0];
        },
        enabled: !!buildingId
    });

    const { data: allOwners = [] } = useQuery({
        queryKey: ['owners'],
        queryFn: async () => {
            const result = await base44.entities.Owner.list();
            return result || [];
        }
    });

    const { data: allShareholders = [] } = useQuery({
        queryKey: ['shareholders'],
        queryFn: async () => {
            const result = await base44.entities.Shareholder.list();
            return result || [];
        }
    });

    const updateBuildingMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Building.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
            toast.success('Eigentümer gespeichert');
        }
    });

    const deleteOwnerMutation = useMutation({
        mutationFn: (ownerId) => base44.entities.Owner.delete(ownerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
            toast.success('Eigentümer gelöscht');
        }
    });

    const updateOwnerMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Owner.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            toast.success('Eigentümer aktualisiert');
            setEditingOwner(null);
        }
    });

    const deleteShareholderMutation = useMutation({
        mutationFn: (id) => base44.entities.Shareholder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shareholders'] });
            toast.success('Gesellschafter gelöscht');
        }
    });

    const handleSaveOwners = async (ownersData) => {
        try {
            const createdOwners = [];
            for (const ownerData of ownersData) {
                const created = await base44.entities.Owner.create({
                    eigentuemer_typ: ownerData.eigentuemer_typ,
                    vorname: ownerData.vorname,
                    nachname: ownerData.nachname,
                    aktiv: true
                });
                createdOwners.push({
                    owner_id: created.id,
                    anteil_prozent: parseFloat(ownerData.anteil_prozent),
                    gueltig_von: ownerData.gueltig_von
                });
            }

            const existingShares = building?.owner_shares || [];
            const updatedShares = [...existingShares, ...createdOwners];

            await updateBuildingMutation.mutateAsync({
                id: buildingId,
                data: { owner_shares: updatedShares }
            });

            await queryClient.invalidateQueries({ queryKey: ['owners'] });
            setAddingOwners(false);
        } catch (error) {
            console.error('Error saving owners:', error);
            toast.error('Fehler: ' + error.message);
        }
    };

    const handleSaveShareholders = async (shareholdersData) => {
        try {
            for (const shareholderData of shareholdersData) {
                const created = await base44.entities.Owner.create({
                    eigentuemer_typ: shareholderData.eigentuemer_typ,
                    vorname: shareholderData.vorname,
                    nachname: shareholderData.nachname,
                    aktiv: true
                });

                await base44.entities.Shareholder.create({
                    owner_id: addingShareholdersFor.id,
                    gesellschafter_owner_id: created.id,
                    anteil_prozent: parseFloat(shareholderData.anteil_prozent),
                    gueltig_von: shareholderData.gueltig_von
                });
            }

            await queryClient.invalidateQueries({ queryKey: ['shareholders'] });
            await queryClient.invalidateQueries({ queryKey: ['owners'] });
            setAddingShareholdersFor(null);
            toast.success('Gesellschafter gespeichert');
        } catch (error) {
            console.error('Error saving shareholders:', error);
            toast.error('Fehler: ' + error.message);
        }
    };

    const getOwnerName = (ownerId) => {
        const owner = allOwners.find(o => o.id === ownerId);
        if (!owner) return 'Unbekannt';
        if (owner.eigentuemer_typ === 'natuerliche_person') {
            return `${owner.vorname || ''} ${owner.nachname}`.trim();
        }
        return owner.nachname;
    };

    const getShareholdersForOwner = (ownerId) => {
        return allShareholders.filter(s => s.owner_id === ownerId);
    };

    const isLegalEntity = (owner) => {
        return owner && owner.eigentuemer_typ !== 'natuerliche_person';
    };

    const handleEditOwner = async (ownerData) => {
        try {
            await updateOwnerMutation.mutateAsync({
                id: editingOwner.id,
                data: ownerData
            });
        } catch (error) {
            console.error('Error updating owner:', error);
            toast.error('Fehler: ' + error.message);
        }
    };

    const handleEditShareholders = async (shareholdersData) => {
        try {
            const existingShareholders = getShareholdersForOwner(editingShareholdersFor.id);
            
            // Alte Gesellschafter löschen
            for (const sh of existingShareholders) {
                await deleteShareholderMutation.mutateAsync(sh.id);
            }

            // Neue Gesellschafter erstellen
            for (const shareholderData of shareholdersData) {
                const created = await base44.entities.Owner.create({
                    eigentuemer_typ: shareholderData.eigentuemer_typ,
                    vorname: shareholderData.vorname,
                    nachname: shareholderData.nachname,
                    aktiv: true
                });

                await base44.entities.Shareholder.create({
                    owner_id: editingShareholdersFor.id,
                    gesellschafter_owner_id: created.id,
                    anteil_prozent: parseFloat(shareholderData.anteil_prozent),
                    gueltig_von: shareholderData.gueltig_von
                });
            }

            await queryClient.invalidateQueries({ queryKey: ['shareholders'] });
            await queryClient.invalidateQueries({ queryKey: ['owners'] });
            setEditingShareholdersFor(null);
            toast.success('Gesellschafter aktualisiert');
        } catch (error) {
            console.error('Error updating shareholders:', error);
            toast.error('Fehler: ' + error.message);
        }
    };

    const ownerShares = building?.owner_shares || [];
    const totalPercent = ownerShares.reduce((sum, s) => sum + (s.anteil_prozent || 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Eigentümer</h3>
                    <p className="text-sm text-slate-600">
                        Gesamt: <span className={totalPercent === 100 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {totalPercent.toFixed(2)}%
                        </span>
                    </p>
                </div>
                {totalPercent < 100 && (
                    <Button
                        onClick={() => setAddingOwners(true)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Eigentümer hinzufügen
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {ownerShares.map((share, index) => {
                    const owner = allOwners.find(o => o.id === share.owner_id);
                    if (!owner) return null;

                    const shareholders = getShareholdersForOwner(owner.id);
                    const shareholderPercent = shareholders.reduce((sum, s) => sum + (s.anteil_prozent || 0), 0);

                    return (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900">
                                                {getOwnerName(owner.id)}
                                            </h4>
                                            <Badge className="bg-emerald-100 text-emerald-700">
                                                {share.anteil_prozent}% am Objekt
                                            </Badge>
                                            {isLegalEntity(owner) && (
                                                <Badge variant="outline">
                                                    {owner.eigentuemer_typ.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingOwner(owner)}
                                            className="text-slate-600"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                                if (confirm('Eigentümer wirklich löschen?')) {
                                                    const updatedShares = ownerShares.filter((_, i) => i !== index);
                                                    await updateBuildingMutation.mutateAsync({
                                                        id: buildingId,
                                                        data: { owner_shares: updatedShares }
                                                    });
                                                    await deleteOwnerMutation.mutateAsync(owner.id);
                                                }
                                            }}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {isLegalEntity(owner) && (
                                    <div className="mt-3 pt-3 border-t space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm">
                                                <span className="font-medium text-slate-700">Gesellschafter:</span>
                                                {shareholders.length > 0 ? (
                                                    <span className={shareholderPercent === 100 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                                                        {shareholderPercent.toFixed(2)}% von 100%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 ml-2">Keine</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                {shareholders.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingShareholdersFor(owner)}
                                                        className="text-slate-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {shareholderPercent < 100 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setAddingShareholdersFor(owner)}
                                                    >
                                                        <Users className="w-4 h-4 mr-2" />
                                                        Gesellschafter hinzufügen
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {shareholders.length > 0 && (
                                            <div className="space-y-1 mt-2">
                                                {shareholders.map((sh) => {
                                                    const shOwner = allOwners.find(o => o.id === sh.gesellschafter_owner_id);
                                                    return (
                                                        <div key={sh.id} className="text-sm text-slate-600 flex items-center gap-2">
                                                            <span>→ {getOwnerName(sh.gesellschafter_owner_id)}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {sh.anteil_prozent}%
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {ownerShares.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-500">Noch keine Eigentümer angelegt</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={addingOwners} onOpenChange={setAddingOwners}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Eigentümer hinzufügen</DialogTitle>
                    </DialogHeader>
                    <SimpleOwnerForm
                        buildingId={buildingId}
                        onSuccess={handleSaveOwners}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!addingShareholdersFor} onOpenChange={(open) => !open && setAddingShareholdersFor(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Gesellschafter hinzufügen</DialogTitle>
                    </DialogHeader>
                    {addingShareholdersFor && (
                        <SimpleShareholderForm
                            ownerId={addingShareholdersFor.id}
                            ownerName={getOwnerName(addingShareholdersFor.id)}
                            onSuccess={handleSaveShareholders}
                            onCancel={() => setAddingShareholdersFor(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingOwner} onOpenChange={(open) => !open && setEditingOwner(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Eigentümer bearbeiten</DialogTitle>
                    </DialogHeader>
                    {editingOwner && (
                        <SimpleOwnerForm
                            buildingId={buildingId}
                            initialOwner={editingOwner}
                            onSuccess={handleEditOwner}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingShareholdersFor} onOpenChange={(open) => !open && setEditingShareholdersFor(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Gesellschafter bearbeiten</DialogTitle>
                    </DialogHeader>
                    {editingShareholdersFor && (
                        <SimpleShareholderForm
                            ownerId={editingShareholdersFor.id}
                            ownerName={getOwnerName(editingShareholdersFor.id)}
                            existingShareholders={getShareholdersForOwner(editingShareholdersFor.id)}
                            allOwners={allOwners}
                            onSuccess={handleEditShareholders}
                            onCancel={() => setEditingShareholdersFor(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}