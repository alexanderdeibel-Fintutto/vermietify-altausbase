import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function RentIncreaseAssistant({ contract, onComplete }) {
    const [open, setOpen] = useState(false);
    const [percentage, setPercentage] = useState('');
    const [effectiveDate, setEffectiveDate] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const validateIncrease = async () => {
        if (!percentage || !effectiveDate) {
            toast.error('Prozentsatz und Datum erforderlich.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await base44.functions.invoke('autoMieterhoehu ng', {
                contract_id: contract.id,
                percentage: parseFloat(percentage),
                effective_date: effectiveDate,
            });
            setValidationResult(result.data);
        } catch (error) {
            toast.error('Fehler bei der Validierung.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setOpen(false);
        setValidationResult(null);
        setPercentage('');
        setEffectiveDate('');
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="outline">Mieterhöhung prüfen</Button>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mieterhöhung-Assistent</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>Prüfen Sie eine potenzielle Mieterhöhung für Vertrag von <strong>{contract.tenant_name}</strong>.</p>
                        <div>
                            <Label>Erhöhung in %</Label>
                            <Input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} />
                        </div>
                        <div>
                            <Label>Wirksam ab</Label>
                            <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
                        </div>
                        <Button onClick={validateIncrease} disabled={isLoading} className="w-full">
                            {isLoading ? 'Prüfe...' : 'Prüfen'}
                        </Button>

                        {validationResult && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prüfergebnis</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className={`p-2 rounded-lg ${validationResult.legal_compliance.status === 'VALID' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <p>Status: {validationResult.legal_compliance.status}</p>
                                        {validationResult.legal_compliance.status !== 'VALID' && <p className="text-sm text-red-800">3-Jahres Limit von 20% überschritten!</p>}
                                    </div>
                                    <p>Alte Miete: €{validationResult.old_rent.toFixed(2)}</p>
                                    <p>Neue Miete: €{validationResult.new_rent.toFixed(2)}</p>
                                    <p>Erhöhung: €{validationResult.increase_amount.toFixed(2)} ({validationResult.increase_percentage}%)</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}