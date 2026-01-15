import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AfaAssetForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const assetId = searchParams.get('id');
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        building_id: '',
        asset_type: 'BUILDING',
        description: '',
        acquisition_date: '',
        acquisition_cost: '',
        land_value: '',
        afa_method: 'LINEAR',
        afa_rate: '',
        afa_duration_years: '',
        start_year: new Date().getFullYear()
    });

    const [errors, setErrors] = useState({});

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        initialData: null
    });

    const { data: buildings } = useQuery({
        queryKey: ['buildings', user?.email],
        queryFn: () => {
            if (!user?.email) return [];
            return base44.entities.Building.filter({ created_by: user.email });
        },
        enabled: !!user?.email,
        initialData: []
    });

    const { data: editingAsset } = useQuery({
        queryKey: ['afaAsset', assetId],
        queryFn: () => assetId ? base44.entities.AfaAsset.get(assetId) : null,
        enabled: !!assetId,
        initialData: null
    });

    useEffect(() => {
        if (editingAsset) {
            setFormData({
                building_id: editingAsset.building_id,
                asset_type: editingAsset.asset_type,
                description: editingAsset.description,
                acquisition_date: editingAsset.acquisition_date,
                acquisition_cost: editingAsset.acquisition_cost,
                land_value: editingAsset.land_value || '',
                afa_method: editingAsset.afa_method,
                afa_rate: editingAsset.afa_rate,
                afa_duration_years: editingAsset.afa_duration_years,
                start_year: editingAsset.start_year
            });
        }
    }, [editingAsset]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.AfaAsset.create(data),
        onSuccess: (result) => {
            // Calculate schedule
            base44.functions.invoke('calculateAfaSchedule', { assetId: result.id });
            queryClient.invalidateQueries({ queryKey: ['afaAssets'] });
            navigate(createPageUrl('AfaOverview'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.AfaAsset.update(assetId, data),
        onSuccess: () => {
            base44.functions.invoke('calculateAfaSchedule', { assetId });
            queryClient.invalidateQueries({ queryKey: ['afaAssets'] });
            navigate(createPageUrl('AfaOverview'));
        }
    });

    const handleDetermineRate = async () => {
        const response = await base44.functions.invoke('determineAfaRate', {
            buildingId: formData.building_id,
            assetType: formData.asset_type
        });
        setFormData({
            ...formData,
            afa_rate: response.data.rate,
            afa_duration_years: response.data.duration
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.description) newErrors.description = 'Erforderlich';
        if (!formData.acquisition_cost) newErrors.acquisition_cost = 'Erforderlich';
        if (!formData.afa_rate) newErrors.afa_rate = 'Erforderlich';
        if (!formData.afa_duration_years) newErrors.afa_duration_years = 'Erforderlich';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const submitData = {
            ...formData,
            acquisition_cost: parseFloat(formData.acquisition_cost),
            land_value: formData.land_value ? parseFloat(formData.land_value) : 0,
            afa_rate: parseFloat(formData.afa_rate),
            afa_duration_years: parseInt(formData.afa_duration_years),
            start_year: parseInt(formData.start_year),
            depreciable_base: parseFloat(formData.acquisition_cost) - (formData.land_value ? parseFloat(formData.land_value) : 0)
        };

        if (assetId) {
            updateMutation.mutate(submitData);
        } else {
            createMutation.mutate(submitData);
        }
    };

    const depreciableBase = parseFloat(formData.acquisition_cost || 0) - parseFloat(formData.land_value || 0);
    const yearlyAfa = depreciableBase > 0 ? (depreciableBase * parseFloat(formData.afa_rate || 0)) / 100 : 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>{assetId ? 'Asset bearbeiten' : 'Neues AfA-Asset'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Grunddaten */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">Grunddaten</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Gebäude
                                        </label>
                                        <select
                                            value={formData.building_id}
                                            onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">-- Wählen --</option>
                                            {buildings.map((b) => (
                                                <option key={b.id} value={b.id}>{b.address}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Asset-Typ
                                        </label>
                                        <select
                                            value={formData.asset_type}
                                            onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="BUILDING">Gebäude</option>
                                            <option value="RENOVATION">Sanierung</option>
                                            <option value="EQUIPMENT">Anlage</option>
                                            <option value="LAND_IMPROVEMENT">Außenanlage</option>
                                            <option value="OTHER">Sonstige</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Beschreibung *
                                        </label>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="z.B. Gebäude Musterstraße 42"
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Anschaffung */}
                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Anschaffung</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Anschaffungsdatum *
                                        </label>
                                        <Input
                                            type="date"
                                            value={formData.acquisition_date}
                                            onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Anschaffungskosten * (€)
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.acquisition_cost}
                                            onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
                                            placeholder="0.00"
                                            className={errors.acquisition_cost ? 'border-red-500' : ''}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Grundstücksanteil (€) - nicht abschreibbar
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.land_value}
                                            onChange={(e) => setFormData({ ...formData, land_value: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="bg-gray-100 p-4 rounded-lg">
                                        <p className="text-sm font-semibold">Abschreibbare Basis</p>
                                        <p className="text-2xl font-bold text-gray-900">€{depreciableBase.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Abschreibung */}
                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Abschreibung</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            AfA-Methode
                                        </label>
                                        <select
                                            value={formData.afa_method}
                                            onChange={(e) => setFormData({ ...formData, afa_method: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="LINEAR">Linear</option>
                                            <option value="DEGRESSIVE">Degressiv</option>
                                            <option value="SONDER_AFA">Sonder-AfA</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                AfA-Satz (%) *
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={formData.afa_rate}
                                                onChange={(e) => setFormData({ ...formData, afa_rate: e.target.value })}
                                                className={errors.afa_rate ? 'border-red-500' : ''}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Laufzeit (Jahre) *
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.afa_duration_years}
                                                onChange={(e) => setFormData({ ...formData, afa_duration_years: e.target.value })}
                                                className={errors.afa_duration_years ? 'border-red-500' : ''}
                                            />
                                        </div>
                                    </div>

                                    <Button type="button" variant="outline" onClick={handleDetermineRate} className="w-full">
                                        💡 Satz automatisch ermitteln
                                    </Button>

                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm font-semibold text-blue-900">Jährliche AfA</p>
                                        <p className="text-2xl font-bold text-blue-900">€{yearlyAfa.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-6">
                                <Button variant="outline" onClick={() => navigate(createPageUrl('AfaOverview'))}>
                                    Abbrechen
                                </Button>
                                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {assetId ? 'Asset aktualisieren' : 'Asset erstellen'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}