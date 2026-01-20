import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileX, Plus, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function TerminationManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        contract_id: '',
        kuendigungsgrund: '',
        kuendigungsdatum: new Date().toISOString().split('T')[0],
        auszugsdatum: ''
    });

    const queryClient = useQueryClient();

    const { data: terminations = [], isLoading } = useQuery({
        queryKey: ['terminations'],
        queryFn: () => base44.entities.ContractTermination.list('-kuendigungsdatum')
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const createTerminationMutation = useMutation({
        mutationFn: (data) => base44.entities.ContractTermination.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['terminations'] });
            setDialogOpen(false);
            setFormData({ contract_id: '', kuendigungsgrund: '', kuendigungsdatum: new Date().toISOString().split('T')[0], auszugsdatum: '' });
            showSuccess('Kündigung erfasst');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createTerminationMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kündigungen</h1>
                    <p className="vf-page-subtitle">{terminations.length} Kündigungen</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Kündigung erfassen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Kündigung</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Vertrag"
                                    value={formData.contract_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, contract_id: value }))}
                                    options={contracts.map(c => ({ value: c.id, label: `Vertrag #${c.id.slice(0, 8)}` }))}
                                    required
                                />
                                <VfTextarea
                                    label="Kündigungsgrund"
                                    value={formData.kuendigungsgrund}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kuendigungsgrund: e.target.value }))}
                                    rows={3}
                                />
                                <VfInput
                                    label="Kündigungsdatum"
                                    type="date"
                                    value={formData.kuendigungsdatum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kuendigungsdatum: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Auszugsdatum"
                                    type="date"
                                    value={formData.auszugsdatum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, auszugsdatum: e.target.value }))}
                                    required
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Erfassen
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {terminations.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileX className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Keine Kündigungen</h3>
                            <p className="text-gray-600">Noch keine Vertragskündigungen erfasst</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {terminations.map((termination) => {
                        const contract = contracts.find(c => c.id === termination.contract_id);
                        const tenant = contract ? tenants.find(t => t.id === contract.tenant_id) : null;

                        return (
                            <Card key={termination.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <FileX className="w-8 h-8 text-red-600" />
                                            <div>
                                                <h3 className="font-semibold mb-1">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </h3>
                                                {termination.kuendigungsgrund && (
                                                    <p className="text-sm text-gray-700 mb-2">{termination.kuendigungsgrund}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>Gekündigt: {new Date(termination.kuendigungsdatum).toLocaleDateString('de-DE')}</span>
                                                    <span>•</span>
                                                    <span>Auszug: {new Date(termination.auszugsdatum).toLocaleDateString('de-DE')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="vf-badge-error">Gekündigt</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}