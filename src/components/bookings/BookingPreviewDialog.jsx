import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingPreviewDialog({ open, onOpenChange, sourceType, sourceId, onSuccess }) {
    const [bookingSuggestions, setBookingSuggestions] = useState(null);
    const [costCategoryId, setCostCategoryId] = useState(null);
    const queryClient = useQueryClient();

    const generateMutation = useMutation({
        mutationFn: async () => {
            console.log('Calling generateBookingsFromSource with:', { source_type: sourceType, source_id: sourceId });
            const response = await base44.functions.invoke('generateBookingsFromSource', {
                source_type: sourceType,
                source_id: sourceId
            });
            console.log('Generate response:', response);
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Success data:', data);
            setBookingSuggestions(data.booking_suggestions.map(s => ({
                ...s,
                building_id: data.building_id
            })));
            if (data.booking_suggestions.length > 0) {
                // Versuche Kostenkategorie zu finden
                const suggestion = data.booking_suggestions[0].cost_category_suggestion;
                loadCostCategory(suggestion);
            }
        },
        onError: (error) => {
            console.error('Generate error full:', error);
            console.error('Error response data:', error.response?.data);
            toast.error('Fehler beim Generieren: ' + (error.response?.data?.error || error.message));
        }
    });

    const createMutation = useMutation({
        mutationFn: async (buildingIdFromParent) => {
            console.log('Creating bookings, buildingId:', buildingIdFromParent);
            const user = await base44.auth.me();
            console.log('User:', user?.email);
            
            const bookingsToCreate = bookingSuggestions.map(suggestion => ({
                building_id: buildingIdFromParent,
                unit_id: suggestion.unit_id || undefined,
                source_type: sourceType,
                source_id: sourceId,
                source_version: 1,
                due_date: suggestion.due_date,
                original_due_date: suggestion.due_date,
                amount: suggestion.amount,
                original_amount: suggestion.amount,
                cost_category_id: costCategoryId || undefined,
                description: suggestion.description,
                booking_status: 'Geplant',
                paid_amount: 0,
                outstanding_amount: suggestion.amount,
                linked_transaction_ids: [],
                linked_payment_ids: [],
                is_automatically_created: true,
                is_future_booking: false,
                last_updated: new Date().toISOString(),
                changed_by: user?.email || 'System',
                is_cancelled: false
            }));

            console.log('Creating', bookingsToCreate.length, 'bookings');
            
            const results = await Promise.all(
                bookingsToCreate.map(booking => 
                    base44.entities.GeneratedFinancialBooking.create(booking)
                )
            );

            console.log('Created', results.length, 'bookings');

            // Markiere Quelle als verarbeitet
            await updateSourceBookingsCreated();

            return results;
        },
        onSuccess: (results) => {
            console.log('Success! Created bookings:', results.length);
            toast.success(`${results.length} Buchungen erstellt`);
            queryClient.invalidateQueries({ queryKey: ['generatedBookings'] });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            console.error('Create mutation error:', error);
            toast.error('Fehler beim Erstellen: ' + error.message);
        }
    });

    const loadCostCategory = async (suggestion) => {
        try {
            const categories = await base44.entities.CostCategory.filter({ name: suggestion });
            if (categories.length > 0) {
                setCostCategoryId(categories[0].id);
            }
        } catch (error) {
            console.error('Load cost category error:', error);
        }
    };

    const updateSourceBookingsCreated = async () => {
        const entityMap = {
            'Grundsteuer': 'PropertyTax',
            'Versicherung': 'Insurance',
            'Kredit': 'Financing',
            'Versorger': 'Supplier',
            'Mietvertrag': 'LeaseContract'
        };

        const entityName = entityMap[sourceType];
        if (entityName) {
            await base44.entities[entityName].update(sourceId, {
                bookings_created: true,
                bookings_created_at: new Date().toISOString(),
                number_of_generated_bookings: bookingSuggestions.length
            });
        }
    };

    React.useEffect(() => {
        if (open && !bookingSuggestions) {
            generateMutation.mutate();
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Buchungsvorschau - {sourceType}</DialogTitle>
                </DialogHeader>

                {generateMutation.isPending ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="ml-3 text-slate-600">Generiere Buchungen...</span>
                    </div>
                ) : bookingSuggestions ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-900">
                                    {bookingSuggestions.length} Buchungen werden erstellt
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {bookingSuggestions.map((booking, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-slate-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge variant="outline">#{index + 1}</Badge>
                                                <span className="font-medium text-slate-800">
                                                    {booking.description}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(booking.due_date).toLocaleDateString('de-DE')}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {booking.amount.toLocaleString('de-DE', { 
                                                        style: 'currency', 
                                                        currency: 'EUR' 
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-700">
                                            Geplant
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => createMutation.mutate(bookingSuggestions[0]?.building_id)}
                        disabled={!bookingSuggestions || createMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Buchungen erstellen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}