import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, Plus, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AfAManagement() {
    const { data: assets = [], isLoading } = useQuery({
        queryKey: ['afaAssets'],
        queryFn: () => base44.entities.AfaAsset.list('-anschaffungsdatum')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.anschaffungskosten) || 0), 0);
    const totalAfA = assets.reduce((sum, a) => sum + (parseFloat(a.jahres_afa_betrag) || 0), 0);

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">AfA-Verwaltung</h1>
                    <p className="vf-page-subtitle">{assets.length} Wirtschaftsgüter</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4" />
                        Wirtschaftsgut hinzufügen
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{assets.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Wirtschaftsgüter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalValue.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtwert</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{totalAfA.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Jährliche AfA</div>
                    </CardContent>
                </Card>
            </div>

            {assets.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <TrendingDown className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine AfA-Objekte</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihr erstes abschreibungsfähiges Wirtschaftsgut hinzu</p>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Erstes Objekt hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {assets.map((asset) => {
                        const building = buildings.find(b => b.id === asset.building_id);
                        return (
                            <Card key={asset.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <TrendingDown className="w-8 h-8 text-indigo-600" />
                                            <div>
                                                <h3 className="font-semibold">{asset.bezeichnung}</h3>
                                                {building && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {building.name}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    AfA-Satz: {asset.afa_satz}% • Anschaffung: {new Date(asset.anschaffungsdatum).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg">{asset.anschaffungskosten?.toLocaleString('de-DE')}€</div>
                                            <div className="text-sm text-gray-600">{asset.jahres_afa_betrag}€ / Jahr</div>
                                        </div>
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