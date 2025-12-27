import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

export default function RentChangeForm({ open, onOpenChange, contract }) {
    const { register, handleSubmit, reset, watch } = useForm();
    const queryClient = useQueryClient();

    const watchBaseRent = watch('base_rent');
    const watchUtilities = watch('utilities');
    const watchHeating = watch('heating');

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.RentChange.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rent-changes'] });
            reset();
            onOpenChange(false);
        }
    });

    React.useEffect(() => {
        if (open) {
            reset({
                base_rent: contract.base_rent,
                utilities: contract.utilities || 0,
                heating: contract.heating || 0
            });
        }
    }, [open, contract, reset]);

    const handleFormSubmit = (data) => {
        const baseRent = parseFloat(data.base_rent) || 0;
        const utilities = parseFloat(data.utilities) || 0;
        const heating = parseFloat(data.heating) || 0;

        createMutation.mutate({
            contract_id: contract.id,
            effective_date: data.effective_date,
            base_rent: baseRent,
            utilities: utilities,
            heating: heating,
            total_rent: baseRent + utilities + heating,
            reason: data.reason || null,
            notes: data.notes || null
        });
    };

    const totalRent = (parseFloat(watchBaseRent) || 0) + 
                      (parseFloat(watchUtilities) || 0) + 
                      (parseFloat(watchHeating) || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Mietvertragsänderung hinzufügen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="effective_date">Gültig ab *</Label>
                        <Input 
                            id="effective_date"
                            type="date"
                            {...register('effective_date', { required: true })}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Neue Mietkonditionen</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="base_rent">Kaltmiete (€) *</Label>
                                <Input 
                                    id="base_rent"
                                    type="number"
                                    step="0.01"
                                    {...register('base_rent', { required: true })}
                                    placeholder="650"
                                />
                            </div>
                            <div>
                                <Label htmlFor="utilities">Nebenkosten (€)</Label>
                                <Input 
                                    id="utilities"
                                    type="number"
                                    step="0.01"
                                    {...register('utilities')}
                                    placeholder="120"
                                />
                            </div>
                            <div>
                                <Label htmlFor="heating">Heizkosten (€)</Label>
                                <Input 
                                    id="heating"
                                    type="number"
                                    step="0.01"
                                    {...register('heating')}
                                    placeholder="80"
                                />
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-emerald-700">Neue Warmmiete gesamt:</span>
                                <span className="text-lg font-bold text-emerald-800">
                                    €{totalRent.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="reason">Grund der Änderung</Label>
                        <Input 
                            id="reason"
                            {...register('reason')}
                            placeholder="z.B. Indexmieterhöhung, Modernisierung..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notizen</Label>
                        <Textarea 
                            id="notes"
                            {...register('notes')}
                            placeholder="Zusätzliche Informationen..."
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Änderung speichern
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}