import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    AlertTriangle, 
    TrendingUp, 
    TrendingDown, 
    Calendar,
    DollarSign,
    Plus,
    Trash2,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function UpdateWarningDialog({ 
    open, 
    onOpenChange, 
    sourceType, 
    newSourceId,
    oldSourceId,
    newBookings,
    onSuccess 
}) {
    const [updateAnalysis, setUpdateAnalysis] = useState(null);
    const queryClient = useQueryClient();

    const analyzeMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('updateExistingBookings', {
                source_type: sourceType,
                source_id: newSourceId,
                new_bookings: newBookings,
                old_source_id: oldSourceId
            });
            return response.data;
        },
        onSuccess: (data) => {
            setUpdateAnalysis(data);
        },
        onError: (error) => {
            toast.error('Fehler bei Analyse: ' + error.message);
        }
    });

    const applyMutation = useMutation({
        mutationFn: async () => {
            // Aktualisiere bestehende Buchungen
            for (const update of updateAnalysis.to_update) {
                await base44.entities.GeneratedFinancialBooking.update(update.booking_id, {
                    due_date: update.new_due_date,
                    amount: update.new_amount,
                    original_due_date: update.old_due_date,
                    original_amount: update.old_amount,
                    source_id: newSourceId,
                    description: update.description,
                    last_updated: new Date().toISOString(),
                    changed_by: 'System-Update'
                });
            }

            // Erstelle neue Buchungen
            for (const newBooking of updateAnalysis.to_create) {
                await base44.entities.GeneratedFinancialBooking.create({
                    building_id: newBooking.building_id,
                    unit_id: newBooking.unit_id,
                    source_type: sourceType,
                    source_id: newSourceId,
                    source_version: 2,
                    due_date: newBooking.due_date,
                    original_due_date: newBooking.due_date,
                    amount: newBooking.amount,
                    original_amount: newBooking.amount,
                    cost_category_id: newBooking.cost_category_id,
                    description: newBooking.description,
                    booking_status: 'Geplant',
                    paid_amount: 0,
                    outstanding_amount: newBooking.amount,
                    is_automatically_created: true,
                    last_updated: new Date().toISOString(),
                    changed_by: 'System-Update'
                });
            }

            // Markiere zu löschende als storniert
            for (const toDelete of updateAnalysis.to_delete) {
                await base44.entities.GeneratedFinancialBooking.update(toDelete.booking_id, {
                    is_cancelled: true,
                    last_updated: new Date().toISOString(),
                    changed_by: 'System-Update',
                    notes: 'Automatisch storniert durch Aktualisierung'
                });
            }

            return updateAnalysis;
        },
        onSuccess: () => {
            toast.success('Buchungen aktualisiert');
            queryClient.invalidateQueries({ queryKey: ['generatedBookings'] });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler beim Anwenden: ' + error.message);
        }
    });

    React.useEffect(() => {
        if (open && !updateAnalysis) {
            analyzeMutation.mutate();
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        Buchungsaktualisierung - {sourceType}
                    </DialogTitle>
                </DialogHeader>

                {analyzeMutation.isPending ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="ml-3">Analysiere Änderungen...</span>
                    </div>
                ) : updateAnalysis ? (
                    <div className="space-y-6">
                        {/* Summary */}
                        <Alert>
                            <AlertDescription>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {updateAnalysis.summary.to_update}
                                        </div>
                                        <div className="text-sm text-slate-600">Zu aktualisieren</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {updateAnalysis.summary.to_create}
                                        </div>
                                        <div className="text-sm text-slate-600">Neu erstellen</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">
                                            {updateAnalysis.summary.to_delete}
                                        </div>
                                        <div className="text-sm text-slate-600">Zu stornieren</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-600">
                                            {updateAnalysis.summary.unchanged}
                                        </div>
                                        <div className="text-sm text-slate-600">Unverändert</div>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {/* Updates */}
                        {updateAnalysis.to_update.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Zu aktualisierende Buchungen ({updateAnalysis.to_update.length})
                                </h3>
                                <div className="space-y-2">
                                    {updateAnalysis.to_update.map((update, idx) => (
                                        <div key={idx} className="p-4 border rounded-lg bg-blue-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="font-medium text-slate-800">
                                                    {update.description}
                                                </span>
                                                <Badge>{update.status}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {update.changes.date_changed && (
                                                    <div>
                                                        <div className="text-slate-600">Datum:</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="line-through text-slate-500">
                                                                {new Date(update.old_due_date).toLocaleDateString('de-DE')}
                                                            </span>
                                                            <span>→</span>
                                                            <span className="font-medium text-blue-700">
                                                                {new Date(update.new_due_date).toLocaleDateString('de-DE')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {update.changes.amount_changed && (
                                                    <div>
                                                        <div className="text-slate-600">Betrag:</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="line-through text-slate-500">
                                                                {update.old_amount.toFixed(2)} €
                                                            </span>
                                                            <span>→</span>
                                                            <span className="font-medium text-blue-700">
                                                                {update.new_amount.toFixed(2)} €
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {(update.linked_transactions.length > 0 || update.paid_amount > 0) && (
                                                <div className="mt-2 text-xs text-slate-600">
                                                    ⚠️ Verknüpfungen bleiben erhalten 
                                                    {update.paid_amount > 0 && ` (${update.paid_amount.toFixed(2)} € bezahlt)`}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New */}
                        {updateAnalysis.to_create.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Neue Buchungen ({updateAnalysis.to_create.length})
                                </h3>
                                <div className="space-y-2">
                                    {updateAnalysis.to_create.map((booking, idx) => (
                                        <div key={idx} className="p-3 border rounded-lg bg-green-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-800">{booking.description}</span>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-slate-600">
                                                        {new Date(booking.due_date).toLocaleDateString('de-DE')}
                                                    </span>
                                                    <span className="font-medium text-green-700">
                                                        {booking.amount.toFixed(2)} €
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Deletes */}
                        {updateAnalysis.to_delete.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Zu stornierende Buchungen ({updateAnalysis.to_delete.length})
                                </h3>
                                <div className="space-y-2">
                                    {updateAnalysis.to_delete.map((booking, idx) => (
                                        <div key={idx} className="p-3 border rounded-lg bg-red-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-800 line-through">
                                                    {booking.description}
                                                </span>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-slate-600">
                                                        {new Date(booking.due_date).toLocaleDateString('de-DE')}
                                                    </span>
                                                    <span className="text-slate-600">
                                                        {booking.amount.toFixed(2)} €
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => applyMutation.mutate()}
                        disabled={!updateAnalysis || applyMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {applyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Änderungen anwenden
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}