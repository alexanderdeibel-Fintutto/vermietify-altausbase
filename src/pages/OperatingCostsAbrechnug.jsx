import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Calculator, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OperatingCostsAbrechnung() {
    const [selectedStatement, setSelectedStatement] = useState(null);

    const { data: statements = [] } = useQuery({
        queryKey: ['operatingCostStatements'],
        queryFn: () => base44.entities.OperatingCostStatement.list('-abrechnungsjahr')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const draftStatements = statements.filter(s => s.status === 'Entwurf');
    const completedStatements = statements.filter(s => s.status === 'Versendet' || s.status === 'Zugestellt');

    const totalCosts = statements.reduce((sum, s) => sum + (parseFloat(s.gesamtkosten) || 0), 0);
    const avgCostsPerBuilding = statements.length > 0 ? totalCosts / buildings.length : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Nebenkostenabrechnung</h1>
                    <p className="vf-page-subtitle">{statements.length} Abrechnungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Calculator className="w-4 h-4" />
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
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalCosts.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtkosten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calculator className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold">{avgCostsPerBuilding.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø pro Gebäude</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{draftStatements.length}</div>
                        <div className="text-sm opacity-90 mt-1">Entwürfe</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Entwürfe ({draftStatements.length})</h3>
                        <div className="space-y-2">
                            {draftStatements.map((statement) => {
                                const building = buildings.find(b => b.id === statement.building_id);
                                return (
                                    <button
                                        key={statement.id}
                                        onClick={() => setSelectedStatement(statement)}
                                        className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition text-left"
                                    >
                                        <div className="font-semibold text-sm">{building?.name || 'Unbekannt'}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {statement.abrechnungsjahr} • {statement.gesamtkosten.toLocaleString('de-DE')}€
                                        </div>
                                        <Badge className="mt-2 vf-badge-warning text-xs">Entwurf</Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Versendet ({completedStatements.length})</h3>
                        <div className="space-y-2">
                            {completedStatements.map((statement) => {
                                const building = buildings.find(b => b.id === statement.building_id);
                                return (
                                    <button
                                        key={statement.id}
                                        onClick={() => setSelectedStatement(statement)}
                                        className="w-full p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-left"
                                    >
                                        <div className="font-semibold text-sm">{building?.name || 'Unbekannt'}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {statement.abrechnungsjahr} • {statement.gesamtkosten.toLocaleString('de-DE')}€
                                        </div>
                                        <Badge className="mt-2 vf-badge-success text-xs">Versendet</Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedStatement && (
                <Card className="border-blue-300 bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">Abrechnung Details</h3>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedStatement(null)}>✕</Button>
                        </div>
                        <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Abrechnungsjahr</div>
                                    <div className="font-semibold text-lg">{selectedStatement.abrechnungsjahr}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Gesamtkosten</div>
                                    <div className="font-semibold text-lg text-green-700">{selectedStatement.gesamtkosten.toLocaleString('de-DE')}€</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Zeitraum</div>
                                    <div className="font-semibold">
                                        {new Date(selectedStatement.zeitraum_von).toLocaleDateString('de-DE')} - {new Date(selectedStatement.zeitraum_bis).toLocaleDateString('de-DE')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Status</div>
                                    <Badge className={
                                        selectedStatement.status === 'Versendet' ? 'vf-badge-info' : 'vf-badge-warning'
                                    }>
                                        {selectedStatement.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button className="flex-1" variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF herunterladen
                                </Button>
                                <Button className="flex-1 vf-btn-primary">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Bearbeiten
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}