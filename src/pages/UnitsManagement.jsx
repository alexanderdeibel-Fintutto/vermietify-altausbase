import React, { useState } from 'react';
import { supabase } from '@/components/services/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, Plus, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function UnitsManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        building_id: '',
        nummer: '',
        flaeche: '',
        zimmer: '',
        stock: ''
    });

    const queryClient = useQueryClient();

    const { data: units = [], isLoading } = useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('v_units_with_lease')
                .select('*')
                .order('created_date', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('v_buildings_summary')
                .select('*');
            if (error) throw error;
            return data;
        }
    });

    const createUnitMutation = useMutation({
        mutationFn: async (data) => {
            const { data: result, error } = await supabase
                .from('Unit')
                .insert([data])
                .select();
            if (error) throw error;
            return result[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setDialogOpen(false);
            setFormData({ building_id: '', nummer: '', flaeche: '', zimmer: '', stock: '' });
            showSuccess('Einheit erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createUnitMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wohneinheiten</h1>
                    <p className="vf-page-subtitle">{units.length} Einheiten verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Einheit hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Wohneinheit</DialogTitle>
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
                                    label="Wohnungsnummer"
                                    value={formData.nummer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nummer: e.target.value }))}
                                    placeholder="z.B. Top 1"
                                    required
                                />
                                <VfInput
                                    label="Wohnfläche"
                                    type="number"
                                    value={formData.flaeche}
                                    onChange={(e) => setFormData(prev => ({ ...prev, flaeche: e.target.value }))}
                                    rightAddon="m²"
                                    required
                                />
                                <VfInput
                                    label="Anzahl Zimmer"
                                    type="number"
                                    value={formData.zimmer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, zimmer: e.target.value }))}
                                />
                                <VfInput
                                    label="Stockwerk"
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
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

            {units.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Home className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Wohneinheiten</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihre erste Wohneinheit hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erste Einheit hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {units.map((unit) => (
                        <Card key={unit.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                        <Home className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">{unit.nummer}</h3>
                                        {unit.flaeche && (
                                            <div className="text-sm text-gray-600">{unit.flaeche} m²</div>
                                        )}
                                        {unit.zimmer && (
                                            <div className="text-sm text-gray-600">{unit.zimmer} Zimmer</div>
                                        )}
                                        {unit.stock && (
                                            <div className="text-sm text-gray-600">Stock {unit.stock}</div>
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