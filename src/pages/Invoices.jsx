import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Plus, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function Invoices() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        building_id: '',
        beschreibung: '',
        betrag: '',
        rechnungsdatum: '',
        faelligkeitsdatum: '',
        kostenart: 'Reparatur'
    });

    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list('-rechnungsdatum')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const createInvoiceMutation = useMutation({
        mutationFn: (data) => base44.entities.Invoice.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setDialogOpen(false);
            setFormData({ building_id: '', beschreibung: '', betrag: '', rechnungsdatum: '', faelligkeitsdatum: '', kostenart: 'Reparatur' });
            showSuccess('Rechnung erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createInvoiceMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Rechnungen</h1>
                    <p className="vf-page-subtitle">{invoices.length} Rechnungen verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Rechnung hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Rechnung</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Gebäude"
                                    value={formData.building_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, building_id: value }))}
                                    options={buildings.map(b => ({ value: b.id, label: b.name }))}
                                    required
                                />
                                <VfInput
                                    label="Beschreibung"
                                    value={formData.beschreibung}
                                    onChange={(e) => setFormData(prev => ({ ...prev, beschreibung: e.target.value }))}
                                    placeholder="z.B. Heizungswartung"
                                    required
                                />
                                <VfInput
                                    label="Betrag"
                                    type="number"
                                    value={formData.betrag}
                                    onChange={(e) => setFormData(prev => ({ ...prev, betrag: e.target.value }))}
                                    rightAddon="€"
                                    required
                                />
                                <VfInput
                                    label="Rechnungsdatum"
                                    type="date"
                                    value={formData.rechnungsdatum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rechnungsdatum: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Fälligkeitsdatum"
                                    type="date"
                                    value={formData.faelligkeitsdatum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, faelligkeitsdatum: e.target.value }))}
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

            {invoices.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Receipt className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Rechnungen</h3>
                            <p className="text-gray-600 mb-6">Erfassen Sie Ihre erste Rechnung</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erste Rechnung erfassen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <Card key={invoice.id} className="vf-card-clickable">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Receipt className="w-8 h-8 text-blue-600" />
                                        <div>
                                            <h3 className="font-semibold">{invoice.beschreibung}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(invoice.rechnungsdatum).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-lg">{invoice.betrag}€</div>
                                        <Badge className="vf-badge-info mt-1">
                                            {invoice.status || 'Offen'}
                                        </Badge>
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