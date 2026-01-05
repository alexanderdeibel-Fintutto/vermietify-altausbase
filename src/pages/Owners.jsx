import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Users, Building2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import OwnerForm from '../components/owners/OwnerForm';
import ShareholderManager from '../components/owners/ShareholderManager';

export default function OwnersPage() {
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [editingOwner, setEditingOwner] = useState(null);
    const [creatingOwner, setCreatingOwner] = useState(false);
    const queryClient = useQueryClient();

    const { data: owners = [], isLoading } = useQuery({
        queryKey: ['owners'],
        queryFn: () => base44.entities.Owner.list()
    });

    const getOwnerDisplayName = (owner) => {
        if (!owner) return '';
        if (owner.eigentuemer_typ === 'natuerliche_person') {
            return `${owner.vorname || ''} ${owner.nachname}`.trim();
        }
        return owner.nachname;
    };

    const isLegalEntity = (owner) => {
        return owner && owner.eigentuemer_typ !== 'natuerliche_person';
    };

    if (isLoading) {
        return <div className="p-8">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Eigentümer</h1>
                    <p className="text-slate-600 mt-1">Verwalten Sie Eigentümer und deren Gesellschafter</p>
                </div>
                <Button onClick={() => setCreatingOwner(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Eigentümer
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Eigentümer Liste */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800">Alle Eigentümer</h2>
                    {owners.map((owner) => (
                        <Card 
                            key={owner.id} 
                            className={`cursor-pointer transition-all ${selectedOwner?.id === owner.id ? 'ring-2 ring-emerald-500' : ''}`}
                            onClick={() => setSelectedOwner(owner)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-slate-900">
                                                {getOwnerDisplayName(owner)}
                                            </h3>
                                            {isLegalEntity(owner) && (
                                                <Badge className="bg-blue-100 text-blue-700">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    {owner.eigentuemer_typ.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                        {owner.strasse && (
                                            <p className="text-sm text-slate-600">
                                                {owner.strasse}, {owner.plz} {owner.ort}
                                            </p>
                                        )}
                                        {owner.email_privat && (
                                            <p className="text-sm text-slate-600">{owner.email_privat}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingOwner(owner);
                                        }}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {owners.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="p-8 text-center">
                                <p className="text-slate-500">Noch keine Eigentümer angelegt</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Details / Gesellschafter */}
                <div>
                    {selectedOwner ? (
                        <div className="space-y-4">
                            <div className="bg-white rounded-lg border p-4">
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">
                                    {getOwnerDisplayName(selectedOwner)}
                                </h2>
                                <div className="space-y-1 text-sm">
                                    <p className="text-slate-600">
                                        <span className="font-medium">Typ:</span> {selectedOwner.eigentuemer_typ}
                                    </p>
                                    {selectedOwner.strasse && (
                                        <p className="text-slate-600">
                                            <span className="font-medium">Adresse:</span> {selectedOwner.strasse}, {selectedOwner.plz} {selectedOwner.ort}
                                        </p>
                                    )}
                                    {selectedOwner.email_privat && (
                                        <p className="text-slate-600">
                                            <span className="font-medium">Email:</span> {selectedOwner.email_privat}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {isLegalEntity(selectedOwner) && (
                                <div className="bg-white rounded-lg border p-4">
                                    <ShareholderManager
                                        ownerId={selectedOwner.id}
                                        ownerName={getOwnerDisplayName(selectedOwner)}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-8 text-center">
                                <p className="text-slate-500">Wählen Sie einen Eigentümer aus, um Details zu sehen</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Owner Dialog */}
            <Dialog open={creatingOwner} onOpenChange={setCreatingOwner}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Neuer Eigentümer</DialogTitle>
                    </DialogHeader>
                    <OwnerForm
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['owners'] });
                            setCreatingOwner(false);
                        }}
                        onCancel={() => setCreatingOwner(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Owner Dialog */}
            <Dialog open={!!editingOwner} onOpenChange={(open) => !open && setEditingOwner(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Eigentümer bearbeiten</DialogTitle>
                    </DialogHeader>
                    {editingOwner && (
                        <OwnerForm
                            initialData={editingOwner}
                            onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['owners'] });
                                setEditingOwner(null);
                            }}
                            onCancel={() => setEditingOwner(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}