import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export default function TenantStatisticsCard({ data, isLoading }) {
    if (isLoading) {
        return <Card><CardContent className="pt-6">Wird geladen...</CardContent></Card>;
    }

    if (!data) {
        return <Card><CardContent className="pt-6">Keine Daten verfügbar</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Mieter-Statistiken: {data.building_name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-xs text-slate-600">Gesamtmieter</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                            {data.tenant_statistics.total_tenants}
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-slate-600">Aktuelle Bewohner</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {data.tenant_statistics.current_occupants}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Fluktuationsrate</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">
                        {data.tenant_statistics.churn_rate_percent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                        {data.tenant_statistics.terminated_last_year} Kündigungen im letzten Jahr
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="text-sm text-slate-600">Ø Mietdauer</span>
                        <span className="font-semibold">
                            {data.tenant_statistics.average_tenure_months.toFixed(1)} Monate
                        </span>
                    </div>

                    <div className="text-sm space-y-2 mt-3 pt-3 border-t">
                        <p className="text-slate-600 font-medium">Mietdauer-Verteilung:</p>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Min:</span>
                            <span>{data.tenure_distribution.min_months.toFixed(1)} M.</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Median:</span>
                            <span>{data.tenure_distribution.median_months.toFixed(1)} M.</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Max:</span>
                            <span>{data.tenure_distribution.max_months.toFixed(1)} M.</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}