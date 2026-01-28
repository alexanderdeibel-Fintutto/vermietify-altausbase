import React, { useState } from 'react';
import { supabase } from '@/components/services/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, MapPin, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function Buildings() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        strasse: '',
        hausnummer: '',
        plz: '',
        ort: '',
        land: 'Österreich'
    });

    const queryClient = useQueryClient();

    const { data: buildings = [], isLoading } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('v_buildings_summary')
                .select('*')
                .order('created_date', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    const createBuildingMutation = useMutation({
        mutationFn: async (data) => {
            const { data: result, error } = await supabase
                .from('Building')
                .insert([data])
                .select();
            if (error) throw error;
            return result[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            setDialogOpen(false);
            setFormData({ name: '', strasse: '', hausnummer: '', plz: '', ort: '', land: 'Österreich' });
            showSuccess('Gebäude erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createBuildingMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Gebäude</h1>
                    <p className="vf-page-subtitle">{buildings.length} Gebäude verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Gebäude hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neues Gebäude</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Gebäudename"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="z.B. Musterstraße 10"
                                    required
                                />
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <VfInput
                                            label="Straße"
                                            value={formData.strasse}
                                            onChange={(e) => setFormData(prev => ({ ...prev, strasse: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <VfInput
                                        label="Nr."
                                        value={formData.hausnummer}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hausnummer: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <VfInput
                                        label="PLZ"
                                        value={formData.plz}
                                        onChange={(e) => setFormData(prev => ({ ...prev, plz: e.target.value }))}
                                        required
                                    />
                                    <div className="col-span-2">
                                        <VfInput
                                            label="Ort"
                                            value={formData.ort}
                                            onChange={(e) => setFormData(prev => ({ ...prev, ort: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                                <VfInput
                                    label="Land"
                                    value={formData.land}
                                    onChange={(e) => setFormData(prev => ({ ...prev, land: e.target.value }))}
                                    required
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

            {buildings.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Building2 className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Gebäude</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihr erstes Gebäude hinzu, um zu starten</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erstes Gebäude hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buildings.map((building) => (
                        <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                            <Card className="vf-card-clickable h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg mb-2">{building.name}</h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                                <MapPin className="w-3 h-3" />
                                                {building.strasse} {building.hausnummer}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {building.plz} {building.ort}
                                            </div>
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