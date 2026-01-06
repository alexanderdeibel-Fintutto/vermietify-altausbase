import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingEditorDialog({ open, onOpenChange, booking, onSuccess }) {
    const [formData, setFormData] = useState(booking || {
        due_date: '',
        amount: 0,
        description: '',
        booking_status: 'Geplant',
        cost_category_id: '',
        notes: ''
    });
    const queryClient = useQueryClient();

    const { data: costCategories = [] } = useQuery({
        queryKey: ['costCategories'],
        queryFn: () => base44.entities.CostCategory.list()
    });

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (booking?.id) {
                return await base44.entities.GeneratedFinancialBooking.update(booking.id, {
                    ...data,
                    last_updated: new Date().toISOString(),
                    changed_by: 'Benutzer'
                });
            } else {
                return await base44.entities.GeneratedFinancialBooking.create({
                    ...data,
                    is_automatically_created: false,
                    paid_amount: 0,
                    outstanding_amount: data.amount,
                    linked_transaction_ids: [],
                    linked_payment_ids: []
                });
            }
        },
        onSuccess: () => {
            toast.success(booking?.id ? 'Buchung aktualisiert' : 'Buchung erstellt');
            queryClient.invalidateQueries({ queryKey: ['generatedBookings'] });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    React.useEffect(() => {
        if (booking) {
            setFormData(booking);
        }
    }, [booking]);

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {booking?.id ? 'Buchung bearbeiten' : 'Neue Buchung'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Fälligkeitsdatum</Label>
                            <Input
                                type="date"
                                value={formData.due_date || ''}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Betrag (EUR)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Beschreibung</Label>
                        <Input
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={formData.booking_status || 'Geplant'}
                                onValueChange={(value) => setFormData({ ...formData, booking_status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Geplant">Geplant</SelectItem>
                                    <SelectItem value="Gebucht">Gebucht</SelectItem>
                                    <SelectItem value="TeilweiseBezahlt">Teilweise bezahlt</SelectItem>
                                    <SelectItem value="Bezahlt">Bezahlt</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Kostenkategorie</Label>
                            <Select
                                value={formData.cost_category_id || ''}
                                onValueChange={(value) => setFormData({ ...formData, cost_category_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategorie wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {costCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>Notizen</Label>
                        <Textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}