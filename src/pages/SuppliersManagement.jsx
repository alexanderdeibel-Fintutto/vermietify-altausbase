import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench, Plus, Mail, Phone, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

const categoryOptions = [
    { value: 'Handwerker', label: 'Handwerker' },
    { value: 'Hausmeister', label: 'Hausmeister' },
    { value: 'Gärtner', label: 'Gärtner' },
    { value: 'Reinigung', label: 'Reinigungsdienst' },
    { value: 'Elektrik', label: 'Elektriker' },
    { value: 'Heizung', label: 'Heizungsbau' },
    { value: 'Sanitär', label: 'Sanitär' },
    { value: 'Sonstige', label: 'Sonstige' }
];

export default function SuppliersManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        kategorie: 'Handwerker',
        email: '',
        telefon: '',
        bemerkungen: ''
    });

    const queryClient = useQueryClient();

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => base44.entities.Supplier.list('-created_date')
    });

    const createSupplierMutation = useMutation({
        mutationFn: (data) => base44.entities.Supplier.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setDialogOpen(false);
            setFormData({ name: '', kategorie: 'Handwerker', email: '', telefon: '', bemerkungen: '' });
            showSuccess('Dienstleister erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createSupplierMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Dienstleister</h1>
                    <p className="vf-page-subtitle">{suppliers.length} Dienstleister verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Dienstleister hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neuer Dienstleister</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Name / Firma"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                                <VfSelect
                                    label="Kategorie"
                                    value={formData.kategorie}
                                    onChange={(value) => setFormData(prev => ({ ...prev, kategorie: value }))}
                                    options={categoryOptions}
                                />
                                <VfInput
                                    label="E-Mail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <VfInput
                                    label="Telefon"
                                    value={formData.telefon}
                                    onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
                                />
                                <VfTextarea
                                    label="Bemerkungen"
                                    value={formData.bemerkungen}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bemerkungen: e.target.value }))}
                                    rows={3}
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

            {suppliers.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Wrench className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Dienstleister</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihren ersten Dienstleister hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Ersten Dienstleister hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((supplier) => (
                        <Card key={supplier.id} className="vf-card-clickable">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">{supplier.name}</h3>
                                        <Badge className="vf-badge-default text-xs mb-2">
                                            {supplier.kategorie}
                                        </Badge>
                                        {supplier.email && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="w-3 h-3" />
                                                {supplier.email}
                                            </div>
                                        )}
                                        {supplier.telefon && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Phone className="w-3 h-3" />
                                                {supplier.telefon}
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