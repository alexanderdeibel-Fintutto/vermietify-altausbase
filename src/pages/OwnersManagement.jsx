import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserCircle, Plus, Building2, Percent } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

const typeOptions = [
    { value: 'Einzelperson', label: 'Einzelperson' },
    { value: 'GmbH', label: 'GmbH' },
    { value: 'GbR', label: 'GbR' },
    { value: 'Sonstige', label: 'Sonstige' }
];

export default function OwnersManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        typ: 'Einzelperson',
        email: '',
        telefon: '',
        anteil: '100'
    });

    const queryClient = useQueryClient();

    const { data: owners = [], isLoading } = useQuery({
        queryKey: ['owners'],
        queryFn: () => base44.entities.Owner.list('-created_date')
    });

    const createOwnerMutation = useMutation({
        mutationFn: (data) => base44.entities.Owner.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            setDialogOpen(false);
            setFormData({ name: '', typ: 'Einzelperson', email: '', telefon: '', anteil: '100' });
            showSuccess('Eigentümer erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createOwnerMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Eigentümer</h1>
                    <p className="vf-page-subtitle">{owners.length} Eigentümer verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Eigentümer hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neuer Eigentümer</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Max Mustermann oder Firma GmbH"
                                    required
                                />
                                <VfSelect
                                    label="Typ"
                                    value={formData.typ}
                                    onChange={(value) => setFormData(prev => ({ ...prev, typ: value }))}
                                    options={typeOptions}
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
                                <VfInput
                                    label="Anteil"
                                    type="number"
                                    value={formData.anteil}
                                    onChange={(e) => setFormData(prev => ({ ...prev, anteil: e.target.value }))}
                                    rightAddon="%"
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

            {owners.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <UserCircle className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Eigentümer</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihren ersten Eigentümer hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Ersten Eigentümer hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {owners.map((owner) => (
                        <Card key={owner.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {owner.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">{owner.name}</h3>
                                        <div className="text-sm text-gray-600 mb-2">{owner.typ}</div>
                                        {owner.anteil && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Percent className="w-3 h-3 text-blue-600" />
                                                <span className="font-semibold text-blue-900">{owner.anteil}% Anteil</span>
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