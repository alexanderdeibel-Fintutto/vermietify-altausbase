import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Building2 } from 'lucide-react';
import OwnerForm from './OwnerForm';

export default function OwnerSelectDialog({ open, onOpenChange, onSelect, excludeIds = [] }) {
    const [createMode, setCreateMode] = useState(false);
    
    const { data: owners = [], isLoading } = useQuery({
        queryKey: ['owners'],
        queryFn: async () => {
            try {
                return await base44.entities.Owner.list();
            } catch (error) {
                console.error('Error loading owners:', error);
                return [];
            }
        },
        enabled: open
    });

    const availableOwners = owners.filter(o => !excludeIds.includes(o.id));

    const handleSelect = (ownerId) => {
        onSelect(ownerId);
        onOpenChange(false);
        setCreateMode(false);
    };

    const handleOwnerCreated = (ownerId) => {
        setCreateMode(false);
        onSelect(ownerId);
        onOpenChange(false);
    };

    const handleDialogChange = (isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setCreateMode(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Eigentümer auswählen</DialogTitle>
                </DialogHeader>

                {!createMode ? (
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">
                                Lade Eigentümer...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {availableOwners.map((owner) => {
                                const displayName = owner.eigentuemer_typ === 'natuerliche_person'
                                    ? `${owner.vorname || ''} ${owner.nachname}`.trim()
                                    : owner.nachname;

                                return (
                                    <Card
                                        key={owner.id}
                                        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => handleSelect(owner.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <User className="w-5 h-5 text-emerald-600 mt-1" />
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">{displayName}</h4>
                                                    <p className="text-sm text-slate-600">{owner.strasse}, {owner.plz} {owner.ort}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {owner.eigentuemer_typ?.replace('_', ' ')}
                                                        </Badge>
                                                        {owner.steuer_id && (
                                                            <Badge variant="outline" className="text-xs">
                                                                St-ID: {owner.steuer_id}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}

                                {availableOwners.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        Keine verfügbaren Eigentümer
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateMode(true)}
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Neuen Eigentümer anlegen
                        </Button>
                    </div>
                ) : (
                    <OwnerForm
                        onSuccess={handleOwnerCreated}
                        onCancel={() => setCreateMode(false)}
                        embedded
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}