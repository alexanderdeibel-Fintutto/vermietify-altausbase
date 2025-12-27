import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PartialRentDialog({ open, onOpenChange, contract, partialAmount, onConfirm }) {
    const [amount, setAmount] = useState(partialAmount);

    const handleConfirm = () => {
        onConfirm(amount);
        onOpenChange(false);
    };

    if (!contract) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Anteilige Miete für ersten Monat</DialogTitle>
                    <DialogDescription>
                        Der Mietvertrag beginnt am {format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })} 
                        und nicht am Monatsanfang. Bitte bestätigen oder passen Sie die anteilige Miete an.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-600">Vollmiete:</span>
                            <span className="font-semibold text-slate-800">€{contract.total_rent?.toFixed(2)}</span>
                            
                            <span className="text-slate-600">Vorgeschlagene anteilige Miete:</span>
                            <span className="font-semibold text-emerald-600">€{partialAmount?.toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="partial_amount">Betrag anpassen (optional)</Label>
                        <Input
                            id="partial_amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            onClick={handleConfirm}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            Bestätigen
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}