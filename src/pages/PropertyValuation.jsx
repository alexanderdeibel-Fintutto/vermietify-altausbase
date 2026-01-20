import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, TrendingUp, Calculator, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PropertyValuation() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0) * 12, 0);
    const estimatedValue = totalRent * 18;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Immobilienbewertung</h1>
                    <p className="vf-page-subtitle">Wertermittlung Ihres Portfolios</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Objekte</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresmiete</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{estimatedValue.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Geschätzter Wert</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-8">
                    <div className="text-center">
                        <Calculator className="w-20 h-20 mx-auto mb-6 text-blue-600" />
                        <h3 className="text-2xl font-bold mb-4">Ertragswertverfahren</h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Die Bewertung basiert auf dem 18-fachen der Jahresmiete. 
                            Dies ist eine vereinfachte Schätzung und keine professionelle Bewertung.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <div className="text-sm text-gray-700 mb-2">Berechnungsformel:</div>
                            <div className="text-xl font-mono">
                                Jahresmiete ({totalRent.toLocaleString('de-DE')}€) × 18 = {estimatedValue.toLocaleString('de-DE')}€
                            </div>
                        </div>
                        <Button className="vf-btn-gradient">
                            Detaillierte Bewertung anfordern
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {buildings.map((building) => {
                    const buildingValue = estimatedValue / buildings.length;
                    return (
                        <Card key={building.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Building2 className="w-8 h-8 text-blue-600" />
                                        <div>
                                            <h3 className="font-semibold">{building.name}</h3>
                                            <div className="text-sm text-gray-600">{building.strasse}, {building.ort}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-700">
                                            {buildingValue.toLocaleString('de-DE')}€
                                        </div>
                                        <div className="text-sm text-gray-600">Geschätzter Wert</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}