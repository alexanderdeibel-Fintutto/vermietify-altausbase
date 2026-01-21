import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Calendar, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VacancyManagement() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const upcomingVacancies = contracts
        .filter(c => new Date(c.mietende) > new Date())
        .filter(c => {
            const daysUntil = (new Date(c.mietende) - new Date()) / (24*60*60*1000);
            return daysUntil <= 90 && daysUntil > 0;
        })
        .sort((a, b) => new Date(a.mietende) - new Date(b.mietende));

    const occupancyRate = units.length > 0 ? (contracts.length / units.length * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Leerstandsverwaltung</h1>
                    <p className="vf-page-subtitle">Ausstehende Übergaben</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{units.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Einheiten gesamt</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Vermietet</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{upcomingVacancies.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Bald frei</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{occupancyRate.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Vermietungsquote</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Bevorstehende Leerstände (90 Tage)</h3>
                    <div className="space-y-2">
                        {upcomingVacancies.map(c => {
                            const daysUntil = Math.ceil((new Date(c.mietende) - new Date()) / (24*60*60*1000));
                            return (
                                <div key={c.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">{c.einheit}</div>
                                            <div className="text-sm text-gray-600">Ende: {new Date(c.mietende).toLocaleDateString('de-DE')}</div>
                                        </div>
                                        <Badge className="vf-badge-warning">{daysUntil} Tage</Badge>
                                    </div>
                                </div>
                            );
                        })}
                        {upcomingVacancies.length === 0 && (
                            <div className="p-4 bg-green-50 rounded-lg text-center text-green-700">
                                Keine Leerstände in den nächsten 90 Tagen erwartet
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}