import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, AlertCircle, CheckCircle, UserPlus, Users, Edit } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import OwnerSelectDialog from './OwnerSelectDialog';
import ShareholderManager from './ShareholderManager';
import OwnerForm from './OwnerForm';

export default function OwnerSharesManager({ shares, onChange, buildingId }) {
    const [creatingNewOwner, setCreatingNewOwner] = useState(false);
    const [editingOwnerId, setEditingOwnerId] = useState(null);
    const queryClient = useQueryClient();

    const { data: owners = [], refetch: refetchOwners } = useQuery({
        queryKey: ['owners'],
        queryFn: () => base44.entities.Owner.list()
    });

    const totalShares = shares.reduce((sum, share) => sum + (parseFloat(share.anteil_prozent) || 0), 0);
    const isValid = Math.abs(totalShares - 100) < 0.01;

    const getOwnerName = (ownerId) => {
        const owner = owners.find(o => o.id === ownerId);
        if (!owner) return 'Unbekannt';
        
        if (owner.eigentuemer_typ === 'natuerliche_person') {
            return `${owner.vorname || ''} ${owner.nachname}`.trim();
        }
        return owner.nachname;
    };

    const isLegalEntity = (ownerId) => {
        const owner = owners.find(o => o.id === ownerId);
        return owner && owner.eigentuemer_typ !== 'natuerliche_person';
    };

    const handleOwnerCreated = async (ownerId) => {
        await queryClient.invalidateQueries({ queryKey: ['owners'] });
        await refetchOwners();
        
        const remainingShare = Math.max(0, 100 - totalShares);
        const newShare = {
            owner_id: ownerId,
            anteil_prozent: remainingShare,
            gueltig_von: new Date().toISOString().split('T')[0],
            grund_aenderung: 'kauf'
        };
        onChange([...shares, newShare]);
        setCreatingNewOwner(false);
    };

    const handleUpdateShare = (index, field, value) => {
        const updated = [...shares];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleRemoveShare = (index) => {
        const updated = shares.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {/* Validation Status */}
            <Alert className={isValid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
                <div className="flex items-start gap-3">
                    {isValid ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <AlertDescription className={isValid ? "text-emerald-800" : "text-amber-800"}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">
                                    Gesamtanteil: {totalShares.toFixed(2)}%
                                </span>
                                {!isValid && (
                                    <span className="text-sm">
                                        Fehlend: {(100 - totalShares).toFixed(2)}%
                                    </span>
                                )}
                            </div>
                            <Progress 
                                value={Math.min(totalShares, 100)} 
                                className={`mt-2 h-2 ${totalShares > 100 ? 'bg-red-100' : ''}`}
                            />
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            {/* Owner Shares List */}
            <div className="space-y-3">
                {shares.map((share, index) => (
                    <Card key={index} className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-semibold text-slate-800">
                                        {getOwnerName(share.owner_id)}
                                    </h4>
                                    <Badge variant="outline">
                                        {share.anteil_prozent}%
                                    </Badge>
                                    {isLegalEntity(share.owner_id) && (
                                        <Badge className="bg-blue-100 text-blue-700">
                                            <Users className="w-3 h-3 mr-1" />
                                            Kapitalgesellschaft
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingOwnerId(share.owner_id)}
                                        className="text-slate-600 hover:text-slate-800"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveShare(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Anteil (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={share.anteil_prozent || ''}
                                        onChange={(e) => handleUpdateShare(index, 'anteil_prozent', parseFloat(e.target.value) || 0)}
                                        placeholder="50.00"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Gültig von</Label>
                                    <Input
                                        type="date"
                                        value={share.gueltig_von || ''}
                                        onChange={(e) => handleUpdateShare(index, 'gueltig_von', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Grund</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={share.grund_aenderung || 'kauf'}
                                        onChange={(e) => handleUpdateShare(index, 'grund_aenderung', e.target.value)}
                                    >
                                        <option value="kauf">Kauf</option>
                                        <option value="verkauf">Verkauf</option>
                                        <option value="erbschaft">Erbschaft</option>
                                        <option value="schenkung">Schenkung</option>
                                        <option value="sonstige">Sonstige</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs">Notarvertrag Datum</Label>
                                    <Input
                                        type="date"
                                        value={share.notarvertrag_datum || ''}
                                        onChange={(e) => handleUpdateShare(index, 'notarvertrag_datum', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Shareholder Management for Legal Entities */}
                            {isLegalEntity(share.owner_id) && share.owner_id && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <ShareholderManager 
                                        key={share.owner_id}
                                        ownerId={share.owner_id} 
                                        ownerName={getOwnerName(share.owner_id)}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add Owner Button */}
            <Button
                type="button"
                variant="outline"
                onClick={() => setCreatingNewOwner(true)}
                className="w-full"
                disabled={totalShares >= 100}
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Eigentümer hinzufügen
            </Button>

            {/* Create New Owner Dialog */}
            {creatingNewOwner && (
                <Dialog open={creatingNewOwner} onOpenChange={setCreatingNewOwner}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Neuer Eigentümer</DialogTitle>
                        </DialogHeader>
                        <OwnerForm
                            onSuccess={handleOwnerCreated}
                            onCancel={() => setCreatingNewOwner(false)}
                            embedded={true}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Edit Owner Dialog */}
            <Dialog open={!!editingOwnerId} onOpenChange={(open) => !open && setEditingOwnerId(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Eigentümer bearbeiten</DialogTitle>
                    </DialogHeader>
                    {editingOwnerId && owners.find(o => o.id === editingOwnerId) && (
                        <OwnerForm
                            initialData={owners.find(o => o.id === editingOwnerId)}
                            onSuccess={async () => {
                                await queryClient.invalidateQueries({ queryKey: ['owners'] });
                                await refetchOwners();
                                setEditingOwnerId(null);
                            }}
                            onCancel={() => setEditingOwnerId(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}