import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, History, Trash2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RentChangeForm from './RentChangeForm';

export default function RentChangeHistory({ contract }) {
    const [formOpen, setFormOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const queryClient = useQueryClient();

    const { data: rentChanges = [] } = useQuery({
        queryKey: ['rent-changes', contract.id],
        queryFn: () => base44.entities.RentChange.filter({ contract_id: contract.id }, '-effective_date')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.RentChange.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rent-changes'] });
            setDeleteId(null);
        }
    });

    // Get current rent (most recent change or original)
    const currentRent = rentChanges.length > 0 ? rentChanges[0] : {
        base_rent: contract.base_rent,
        utilities: contract.utilities,
        heating: contract.heating,
        total_rent: contract.total_rent,
        effective_date: contract.start_date
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" />
                        <div>
                            <CardTitle>Mietentwicklung</CardTitle>
                            <CardDescription>Historie aller Mietvertragsänderungen</CardDescription>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setFormOpen(true)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Änderung hinzufügen
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Current Rent Display */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-emerald-700">Aktuelle Miete</span>
                        <Badge className="bg-emerald-600 text-white">Gültig</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-slate-600">Kaltmiete</span>
                            <p className="font-semibold text-slate-800">€{currentRent.base_rent?.toFixed(2)}</p>
                        </div>
                        <div>
                            <span className="text-slate-600">Nebenkosten</span>
                            <p className="font-semibold text-slate-800">€{currentRent.utilities?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                            <span className="text-slate-600">Heizkosten</span>
                            <p className="font-semibold text-slate-800">€{currentRent.heating?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                            <span className="text-slate-600">Warmmiete</span>
                            <p className="font-bold text-emerald-700 text-lg">€{currentRent.total_rent?.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Historie</h4>
                    
                    {/* Original rent */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-700">
                                    {format(parseISO(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                                </span>
                                <Badge variant="outline" className="text-xs">Ursprungsmiete</Badge>
                            </div>
                            <div className="text-xs text-slate-500">
                                Kaltmiete: €{contract.base_rent?.toFixed(2)} • 
                                NK: €{contract.utilities?.toFixed(2) || '0.00'} • 
                                HK: €{contract.heating?.toFixed(2) || '0.00'} • 
                                Gesamt: €{contract.total_rent?.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Changes - sorted newest to oldest */}
                    {[...rentChanges].sort((a, b) => 
                        new Date(b.effective_date) - new Date(a.effective_date)
                    ).map((change, index) => (
                        <div 
                            key={change.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-slate-700">
                                        {format(parseISO(change.effective_date), 'dd.MM.yyyy', { locale: de })}
                                    </span>
                                    {index === 0 && (
                                        <Badge className="bg-emerald-600 text-white text-xs">Aktuell</Badge>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 mb-1">
                                    Kaltmiete: €{change.base_rent?.toFixed(2)} • 
                                    NK: €{change.utilities?.toFixed(2) || '0.00'} • 
                                    HK: €{change.heating?.toFixed(2) || '0.00'} • 
                                    Gesamt: €{change.total_rent?.toFixed(2)}
                                </div>
                                {change.reason && (
                                    <p className="text-xs text-slate-600 italic">{change.reason}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(change.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}

                    {rentChanges.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">
                            Noch keine Mietvertragsänderungen erfasst
                        </p>
                    )}
                </div>
            </CardContent>

            <RentChangeForm
                open={formOpen}
                onOpenChange={setFormOpen}
                contract={contract}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Änderung löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Mietvertragsänderung wird dauerhaft gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}