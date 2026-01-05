import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';
import OwnerSelectDialog from './OwnerSelectDialog';

export default function GesellschafterManager({ gesellschafter = [], onChange, currentOwnerId }) {
    const [selectDialogOpen, setSelectDialogOpen] = useState(false);

    const { data: owners = [] } = useQuery({
        queryKey: ['owners'],
        queryFn: () => base44.entities.Owner.list()
    });

    const handleAddGesellschafter = (ownerId) => {
        const newGesellschafter = {
            owner_id: ownerId,
            anteil_prozent: 0,
            gueltig_von: new Date().toISOString().split('T')[0]
        };
        onChange([...gesellschafter, newGesellschafter]);
        setSelectDialogOpen(false);
    };

    const handleUpdateGesellschafter = (index, field, value) => {
        const updated = [...gesellschafter];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleRemoveGesellschafter = (index) => {
        onChange(gesellschafter.filter((_, i) => i !== index));
    };

    const getOwnerName = (ownerId) => {
        const owner = owners.find(o => o.id === ownerId);
        if (!owner) return 'Unbekannt';
        
        if (owner.eigentuemer_typ === 'natuerliche_person') {
            return `${owner.vorname || ''} ${owner.nachname || ''}`.trim();
        }
        return `${owner.nachname || ''} ${owner.firma_zusatz || ''}`.trim();
    };

    const totalAnteil = gesellschafter.reduce((sum, g) => sum + (parseFloat(g.anteil_prozent) || 0), 0);
    const isValid = Math.abs(totalAnteil - 100) < 0.01;

    const excludeIds = currentOwnerId ? [currentOwnerId, ...gesellschafter.map(g => g.owner_id)] : gesellschafter.map(g => g.owner_id);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-slate-700">Gesellschafter/Eigentümer</h4>
                    <p className="text-sm text-slate-500">Anteile müssen zusammen 100% ergeben</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectDialogOpen(true)}
                    className="gap-2"
                    disabled={totalAnteil >= 100}
                >
                    <UserPlus className="w-4 h-4" />
                    Hinzufügen
                </Button>
            </div>

            {!isValid && gesellschafter.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-800">
                        Anteile ergeben {totalAnteil.toFixed(2)}% (sollte 100% sein)
                    </span>
                </div>
            )}

            <div className="space-y-3">
                {gesellschafter.map((g, index) => (
                    <Card key={index} className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-medium text-slate-800">{getOwnerName(g.owner_id)}</div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveGesellschafter(index)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Anteil (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={g.anteil_prozent || ''}
                                        onChange={(e) => handleUpdateGesellschafter(index, 'anteil_prozent', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <Label>Gültig von</Label>
                                    <Input
                                        type="date"
                                        value={g.gueltig_von || ''}
                                        onChange={(e) => handleUpdateGesellschafter(index, 'gueltig_von', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Bemerkungen</Label>
                                <Input
                                    value={g.bemerkungen || ''}
                                    onChange={(e) => handleUpdateGesellschafter(index, 'bemerkungen', e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </Card>
                ))}

                {gesellschafter.length === 0 && (
                    <Card className="p-8 text-center border-dashed">
                        <UserPlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Noch keine Gesellschafter hinzugefügt</p>
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => setSelectDialogOpen(true)}
                            className="mt-2"
                        >
                            Ersten Gesellschafter hinzufügen
                        </Button>
                    </Card>
                )}
            </div>

            <OwnerSelectDialog
                open={selectDialogOpen}
                onOpenChange={setSelectDialogOpen}
                onSelect={handleAddGesellschafter}
                excludeIds={excludeIds}
            />
        </div>
    );
}