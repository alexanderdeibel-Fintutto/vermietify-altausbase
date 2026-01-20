import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cog, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

const typeOptions = [
    { value: 'Heizung', label: 'Heizung' },
    { value: 'Aufzug', label: 'Aufzug' },
    { value: 'Rauchmelder', label: 'Rauchmelder' },
    { value: 'Elektrik', label: 'Elektrik' },
    { value: 'Sonstige', label: 'Sonstige' }
];

export default function Equipment() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        building_id: '',
        typ: 'Heizung',
        bezeichnung: '',
        hersteller: '',
        baujahr: '',
        naechste_wartung: ''
    });

    const queryClient = useQueryClient();

    const { data: equipment = [], isLoading } = useQuery({
        queryKey: ['equipment'],
        queryFn: () => base44.entities.Equipment.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const createEquipmentMutation = useMutation({
        mutationFn: (data) => base44.entities.Equipment.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            setDialogOpen(false);
            setFormData({ building_id: '', typ: 'Heizung', bezeichnung: '', hersteller: '', baujahr: '', naechste_wartung: '' });
            showSuccess('Ausstattung erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createEquipmentMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Ausstattung & Anlagen</h1>
                    <p className="vf-page-subtitle">{equipment.length} Anlagen verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Anlage hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Anlage</DialogTitle>
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
                                    label="Typ"
                                    value={formData.typ}
                                    onChange={(value) => setFormData(prev => ({ ...prev, typ: value }))}
                                    options={typeOptions}
                                />
                                <VfInput
                                    label="Bezeichnung"
                                    value={formData.bezeichnung}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bezeichnung: e.target.value }))}
                                    placeholder="z.B. Gastherme Erdgeschoss"
                                    required
                                />
                                <VfInput
                                    label="Hersteller"
                                    value={formData.hersteller}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hersteller: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <VfInput
                                        label="Baujahr"
                                        type="number"
                                        value={formData.baujahr}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baujahr: e.target.value }))}
                                    />
                                    <VfInput
                                        label="Nächste Wartung"
                                        type="date"
                                        value={formData.naechste_wartung}
                                        onChange={(e) => setFormData(prev => ({ ...prev, naechste_wartung: e.target.value }))}
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

            {equipment.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Cog className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Anlagen</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihre erste Anlage hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erste Anlage hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipment.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                        <Cog className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <Badge className="vf-badge-default text-xs mb-2">{item.typ}</Badge>
                                        <h3 className="font-semibold mb-1">{item.bezeichnung}</h3>
                                        {item.hersteller && (
                                            <div className="text-sm text-gray-600">{item.hersteller}</div>
                                        )}
                                        {item.naechste_wartung && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                Wartung: {new Date(item.naechste_wartung).toLocaleDateString('de-DE')}
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