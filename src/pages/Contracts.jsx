import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Calendar, Euro } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { showSuccess } from '@/components/notifications/ToastNotification';
import { Badge } from '@/components/ui/badge';

export default function Contracts() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        unit_id: '',
        tenant_id: '',
        mietbeginn: '',
        kaltmiete: '',
        betriebskosten_vorauszahlung: '',
        kaution: ''
    });

    const queryClient = useQueryClient();

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list('-created_date')
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const createContractMutation = useMutation({
        mutationFn: (data) => base44.entities.LeaseContract.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            setDialogOpen(false);
            setFormData({ unit_id: '', tenant_id: '', mietbeginn: '', kaltmiete: '', betriebskosten_vorauszahlung: '', kaution: '' });
            showSuccess('Vertrag erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createContractMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietverträge</h1>
                    <p className="vf-page-subtitle">{contracts.length} Verträge verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Vertrag hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neuer Mietvertrag</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Wohneinheit"
                                    value={formData.unit_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
                                    options={units.map(u => ({ value: u.id, label: u.nummer }))}
                                    required
                                />
                                <VfSelect
                                    label="Mieter"
                                    value={formData.tenant_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, tenant_id: value }))}
                                    options={tenants.map(t => ({ value: t.id, label: `${t.vorname} ${t.nachname}` }))}
                                    required
                                />
                                <VfInput
                                    label="Mietbeginn"
                                    type="date"
                                    value={formData.mietbeginn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mietbeginn: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Kaltmiete (monatlich)"
                                    type="number"
                                    value={formData.kaltmiete}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kaltmiete: e.target.value }))}
                                    rightAddon="€"
                                    required
                                />
                                <VfInput
                                    label="Betriebskosten (monatlich)"
                                    type="number"
                                    value={formData.betriebskosten_vorauszahlung}
                                    onChange={(e) => setFormData(prev => ({ ...prev, betriebskosten_vorauszahlung: e.target.value }))}
                                    rightAddon="€"
                                />
                                <VfInput
                                    label="Kaution"
                                    type="number"
                                    value={formData.kaution}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kaution: e.target.value }))}
                                    rightAddon="€"
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Erstellen
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {contracts.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Verträge</h3>
                            <p className="text-gray-600 mb-6">Erstellen Sie Ihren ersten Mietvertrag</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Ersten Vertrag erstellen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {contracts.map((contract) => (
                        <Link key={contract.id} to={createPageUrl('ContractDetail') + `?id=${contract.id}`}>
                            <Card className="vf-card-clickable">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <FileText className="w-10 h-10 text-purple-600" />
                                            <div>
                                                <h3 className="font-semibold">Vertrag #{contract.id?.slice(0, 8)}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    ab {new Date(contract.mietbeginn).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg">{contract.kaltmiete}€</div>
                                            <div className="text-sm text-gray-500">Kaltmiete</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}