import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function RentIncreaseWizard() {
    const [selectedContract, setSelectedContract] = useState('');
    const [newRent, setNewRent] = useState('');
    const queryClient = useQueryClient();

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const contract = contracts.find(c => c.id === selectedContract);
    const tenant = contract ? tenants.find(t => t.id === contract.tenant_id) : null;
    const currentRent = contract ? parseFloat(contract.kaltmiete) : 0;
    const increase = newRent ? parseFloat(newRent) - currentRent : 0;
    const increasePercent = currentRent > 0 ? (increase / currentRent * 100) : 0;

    const createIncreaseMutation = useMutation({
        mutationFn: (data) => base44.entities.RentIncrease.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentIncreases'] });
            showSuccess('Mieterhöhung erfasst');
            setSelectedContract('');
            setNewRent('');
        }
    });

    const handleSubmit = () => {
        createIncreaseMutation.mutate({
            contract_id: selectedContract,
            alte_miete: currentRent,
            neue_miete: parseFloat(newRent),
            erhoehung_prozent: increasePercent,
            wirksamkeitsdatum: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieterhöhungs-Assistent</h1>
                    <p className="vf-page-subtitle">Rechtssichere Mietanpassung</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <VfSelect
                        label="Mietvertrag auswählen"
                        value={selectedContract}
                        onChange={setSelectedContract}
                        options={contracts.map(c => {
                            const t = tenants.find(tenant => tenant.id === c.tenant_id);
                            return {
                                value: c.id,
                                label: t ? `${t.vorname} ${t.nachname} - ${c.kaltmiete}€` : `Vertrag ${c.id.slice(0, 8)}`
                            };
                        })}
                        placeholder="Vertrag wählen..."
                    />

                    {contract && (
                        <>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="font-semibold mb-2">Aktueller Vertrag</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">Mieter</div>
                                        <div className="font-medium">{tenant?.vorname} {tenant?.nachname}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Aktuelle Miete</div>
                                        <div className="font-medium">{currentRent}€</div>
                                    </div>
                                </div>
                            </div>

                            <VfInput
                                label="Neue Miete"
                                type="number"
                                step="0.01"
                                value={newRent}
                                onChange={(e) => setNewRent(e.target.value)}
                                rightAddon="€"
                            />

                            {newRent && (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-lg ${increasePercent <= 15 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                        <div className="flex items-start gap-3">
                                            {increasePercent <= 15 ? (
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <AlertCircle className="w-6 h-6 text-red-600" />
                                            )}
                                            <div>
                                                <div className="font-semibold mb-1">
                                                    Erhöhung: {increase.toFixed(2)}€ ({increasePercent.toFixed(1)}%)
                                                </div>
                                                <div className={`text-sm ${increasePercent <= 15 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {increasePercent <= 15 
                                                        ? '✓ Innerhalb der 15% Kappungsgrenze' 
                                                        : '⚠ Überschreitet die 15% Kappungsgrenze!'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        className="vf-btn-gradient w-full" 
                                        onClick={handleSubmit}
                                        disabled={increasePercent > 15}
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        Mieterhöhung durchführen
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}