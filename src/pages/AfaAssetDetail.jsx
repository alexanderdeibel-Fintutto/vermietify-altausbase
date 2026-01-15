import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AfaAssetDetail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const assetId = searchParams.get('id');

    const { data: asset } = useQuery({
        queryKey: ['afaAsset', assetId],
        queryFn: () => assetId ? base44.entities.AfaAsset.get(assetId) : null,
        enabled: !!assetId,
        initialData: null
    });

    const { data: schedule } = useQuery({
        queryKey: ['afaSchedule', assetId],
        queryFn: () => {
            if (!assetId) return [];
            return base44.entities.AfaYearlyEntry.filter({ afa_asset_id: assetId });
        },
        enabled: !!assetId,
        initialData: []
    });

    if (!asset) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Button variant="ghost" onClick={() => navigate(createPageUrl('AfaOverview'))}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
                    </Button>
                    <p className="mt-4 text-gray-600">Asset nicht gefunden</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <Button variant="ghost" onClick={() => navigate(createPageUrl('AfaOverview'))}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900 mt-4">{asset.description}</h1>
                    </div>
                    <Button onClick={() => navigate(createPageUrl(`AfaAssetForm?id=${assetId}`))}>
                        <Pencil className="w-4 h-4 mr-2" /> Bearbeiten
                    </Button>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-600">Anschaffung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">€{asset.acquisition_cost.toLocaleString()}</div>
                            <p className="text-xs text-gray-500 mt-1">{new Date(asset.acquisition_date).toLocaleDateString('de-DE')}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-600">AfA-Satz & Laufzeit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{asset.afa_rate}% / {asset.afa_duration_years}a</div>
                            <p className="text-xs text-gray-500 mt-1">{asset.afa_method === 'LINEAR' ? 'Linear' : asset.afa_method}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-600">Restwert</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">€{asset.remaining_value.toLocaleString()}</div>
                            <p className="text-xs text-gray-500 mt-1">Ende: {asset.end_year}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Schedule Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>AfA-Jahresplan</CardTitle>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" /> PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-semibold">Jahr</th>
                                        <th className="text-right py-2 px-3 font-semibold">AfA-Betrag</th>
                                        <th className="text-right py-2 px-3 font-semibold">Kumuliert</th>
                                        <th className="text-right py-2 px-3 font-semibold">Restwert</th>
                                        <th className="text-left py-2 px-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.map((entry, idx) => (
                                        <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="py-2 px-3 text-gray-900">
                                                {entry.year}
                                                {entry.is_partial_year && ` (${entry.partial_months}M)`}
                                            </td>
                                            <td className="text-right py-2 px-3">€{entry.afa_amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                                            <td className="text-right py-2 px-3">€{entry.cumulative_afa.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                                            <td className="text-right py-2 px-3">€{entry.remaining_value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-2 px-3">
                                                {entry.status === 'BOOKED' && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Gebucht</span>}
                                                {entry.status === 'PLANNED' && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">○ Geplant</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}