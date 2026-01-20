import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Plus, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

const insuranceTypes = [
    { value: 'Wohngebäude', label: 'Wohngebäudeversicherung' },
    { value: 'Haftpflicht', label: 'Haftpflichtversicherung' },
    { value: 'Glas', label: 'Glasversicherung' },
    { value: 'Elementar', label: 'Elementarversicherung' },
    { value: 'Mietausfall', label: 'Mietausfallversicherung' }
];

export default function InsuranceManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        building_id: '',
        versicherungsart: 'Wohngebäude',
        versicherer_name: '',
        versicherungsnummer: '',
        jahresbeitrag: '',
        vertragsbeginn: '',
        vertragsende: '',
        status: 'Aktiv'
    });

    const queryClient = useQueryClient();

    const { data: policies = [], isLoading } = useQuery({
        queryKey: ['insurancePolicies'],
        queryFn: () => base44.entities.InsurancePolicy.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const createPolicyMutation = useMutation({
        mutationFn: (data) => base44.entities.InsurancePolicy.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insurancePolicies'] });
            setDialogOpen(false);
            setFormData({ building_id: '', versicherungsart: 'Wohngebäude', versicherer_name: '', versicherungsnummer: '', jahresbeitrag: '', vertragsbeginn: '', vertragsende: '', status: 'Aktiv' });
            showSuccess('Versicherung erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createPolicyMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Versicherungen</h1>
                    <p className="vf-page-subtitle">{policies.length} Versicherungen verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Versicherung hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Neue Versicherung</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Gebäude"
                                    value={formData.building_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, building_id: value }))}
                                    options={buildings.map(b => ({ value: b.id, label: b.name }))}
                                    required
                                />
                                <VfSelect
                                    label="Versicherungsart"
                                    value={formData.versicherungsart}
                                    onChange={(value) => setFormData(prev => ({ ...prev, versicherungsart: value }))}
                                    options={insuranceTypes}
                                    required
                                />
                                <VfInput
                                    label="Versicherer"
                                    value={formData.versicherer_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, versicherer_name: e.target.value }))}
                                    placeholder="z.B. Allianz"
                                    required
                                />
                                <VfInput
                                    label="Versicherungsnummer"
                                    value={formData.versicherungsnummer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, versicherungsnummer: e.target.value }))}
                                />
                                <VfInput
                                    label="Jahresbeitrag"
                                    type="number"
                                    value={formData.jahresbeitrag}
                                    onChange={(e) => setFormData(prev => ({ ...prev, jahresbeitrag: e.target.value }))}
                                    rightAddon="€"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <VfInput
                                        label="Vertragsbeginn"
                                        type="date"
                                        value={formData.vertragsbeginn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vertragsbeginn: e.target.value }))}
                                        required
                                    />
                                    <VfInput
                                        label="Vertragsende"
                                        type="date"
                                        value={formData.vertragsende}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vertragsende: e.target.value }))}
                                    />
                                </div>
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

            {policies.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Shield className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Versicherungen</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihre erste Versicherung hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erste Versicherung hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {policies.map((policy) => (
                        <Card key={policy.id} className="vf-card-clickable">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Shield className="w-10 h-10 text-indigo-600" />
                                        <div>
                                            <h3 className="font-semibold text-lg">{policy.versicherungsart}</h3>
                                            <div className="text-sm text-gray-600 mt-1">{policy.versicherer_name}</div>
                                            {policy.versicherungsnummer && (
                                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                                    {policy.versicherungsnummer}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-lg mb-2">{policy.jahresbeitrag}€</div>
                                        <Badge className={
                                            policy.status === 'Aktiv' ? 'vf-badge-success' :
                                            policy.status === 'Gekündigt' ? 'vf-badge-warning' :
                                            'vf-badge-default'
                                        }>
                                            {policy.status}
                                        </Badge>
                                        {policy.vertragsende && new Date(policy.vertragsende) < new Date(Date.now() + 90*24*60*60*1000) && (
                                            <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
                                                <AlertCircle className="w-3 h-3" />
                                                Läuft bald aus
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}