import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function AfaOverview() {
    const navigate = useNavigate();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        initialData: null
    });

    const { data: assets } = useQuery({
        queryKey: ['afaAssets', user?.email],
        queryFn: () => {
            if (!user?.email) return [];
            return base44.entities.AfaAsset.filter({ created_by: user.email });
        },
        enabled: !!user?.email,
        initialData: []
    });

    const totalInitialCost = assets.reduce((sum, a) => sum + a.acquisition_cost, 0);
    const totalCumulativeAfa = assets.reduce((sum, a) => sum + (a.afa_amount || 0), 0);
    const totalRemainingValue = assets.reduce((sum, a) => sum + a.remaining_value, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">AfA-Übersicht</h1>
                        <p className="text-gray-600 mt-1">Verwalte deine Abschreibungen</p>
                    </div>
                    <Button onClick={() => navigate(createPageUrl('AfaAssetForm'))}>
                        <Plus className="w-4 h-4 mr-2" />
                        Neues Asset
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-600">Gesamt-Anschaffung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                €{(totalInitialCost / 1000).toFixed(0)}k
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{assets.length} Assets</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-600">Kumulierte AfA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                €{(totalCumulativeAfa / 1000).toFixed(0)}k
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {totalInitialCost > 0 ? ((totalCumulativeAfa / totalInitialCost) * 100).toFixed(1) : 0}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-600">Restbuchwert</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                €{(totalRemainingValue / 1000).toFixed(0)}k
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {totalInitialCost > 0 ? ((totalRemainingValue / totalInitialCost) * 100).toFixed(1) : 0}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Assets List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {assets.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">Noch keine Assets erfasst</p>
                                <Button onClick={() => navigate(createPageUrl('AfaAssetForm'))}>
                                    Erstes Asset erstellen
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assets.map((asset) => (
                                    <div key={asset.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{asset.description}</h3>
                                                <div className="text-sm text-gray-600 mt-2 space-y-1">
                                                    <p>Anschaffung: {new Date(asset.acquisition_date).toLocaleDateString('de-DE')} | €{asset.acquisition_cost.toLocaleString()}</p>
                                                    <p>AfA: {asset.afa_rate}% {asset.afa_method === 'LINEAR' ? 'linear' : asset.afa_method.toLowerCase()} | {asset.afa_duration_years} Jahre</p>
                                                </div>
                                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{
                                                            width: `${Math.min((asset.cumulative_afa / asset.acquisition_cost) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    €{asset.cumulative_afa?.toLocaleString() || 0} / €{asset.acquisition_cost.toLocaleString()} ({asset.cumulative_afa ? ((asset.cumulative_afa / asset.acquisition_cost) * 100).toFixed(1) : 0}%)
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={() => navigate(createPageUrl(`AfaAssetDetail?id=${asset.id}`))}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}