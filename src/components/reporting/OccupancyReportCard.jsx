import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home } from 'lucide-react';

export default function OccupancyReportCard({ data, isLoading }) {
    if (isLoading) {
        return <Card><CardContent className="pt-6">Wird geladen...</CardContent></Card>;
    }

    if (!data) {
        return <Card><CardContent className="pt-6">Keine Daten verfügbar</CardContent></Card>;
    }

    const occupancyColor = data.occupancy_summary.occupancy_rate > 80 
        ? 'text-green-600' 
        : data.occupancy_summary.occupancy_rate > 50 
        ? 'text-yellow-600' 
        : 'text-red-600';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Auslastungsbericht: {data.building_name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Auslastungsquote</p>
                    <p className={`text-4xl font-bold ${occupancyColor} mt-2`}>
                        {data.occupancy_summary.occupancy_rate.toFixed(1)}%
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {data.occupancy_summary.total_units}
                        </p>
                        <p className="text-xs text-slate-600">Insgesamt</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {data.occupancy_summary.occupied_units}
                        </p>
                        <p className="text-xs text-slate-600">Vermietete</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">
                            {data.occupancy_summary.vacant_units}
                        </p>
                        <p className="text-xs text-slate-600">Freie</p>
                    </div>
                </div>

                {data.floor_breakdown.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Nach Etage:</p>
                        {data.floor_breakdown.map((floor, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-slate-600">Etage {floor.floor}</span>
                                <div className="flex items-center gap-2">
                                    <span>{floor.occupied_units}/{floor.total_units}</span>
                                    <Badge variant="outline">
                                        {floor.occupancy_rate.toFixed(0)}%
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}