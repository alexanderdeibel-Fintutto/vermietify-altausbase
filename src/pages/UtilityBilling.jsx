import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Zap, FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function UtilityBilling() {
    const { data: statements = [] } = useQuery({
        queryKey: ['operatingCostStatements'],
        queryFn: () => base44.entities.OperatingCostStatement.list('-abrechnungsjahr')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const draftStatements = statements.filter(s => s.status === 'Entwurf');
    const sentStatements = statements.filter(s => s.status === 'Versendet');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Nebenkostenabrechnungen</h1>
                    <p className="vf-page-subtitle">{statements.length} Abrechnungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Abrechnung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{statements.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Abrechnungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{draftStatements.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Entwürfe</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{sentStatements.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Versendet</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">2025</div>
                        <div className="text-sm opacity-90 mt-1">Aktuelles Jahr</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Abrechnungen nach Jahr</h3>
                    <div className="space-y-2">
                        {statements.map((statement) => {
                            const building = buildings.find(b => b.id === statement.building_id);
                            return (
                                <div key={statement.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{building?.name || 'Unbekannt'}</div>
                                            <div className="text-sm text-gray-600">Jahr {statement.abrechnungsjahr}</div>
                                        </div>
                                        <Badge className={
                                            statement.status === 'Versendet' ? 'vf-badge-success' : 
                                            statement.status === 'Berechnet' ? 'vf-badge-primary' : 
                                            'vf-badge-default'
                                        }>
                                            {statement.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                                        <div>
                                            <div className="text-gray-600">Gesamtkosten</div>
                                            <div className="font-semibold">{statement.gesamtkosten?.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Vorauszahlungen</div>
                                            <div className="font-semibold">{statement.gesamtvorauszahlungen?.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Ergebnis</div>
                                            <div className={`font-semibold ${statement.gesamtergebnis > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                                {statement.gesamtergebnis?.toLocaleString('de-DE')}€
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}