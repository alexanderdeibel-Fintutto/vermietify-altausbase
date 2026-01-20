import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calculator, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TaxDocuments() {
    const { data: anlagenV = [] } = useQuery({
        queryKey: ['anlagenV'],
        queryFn: () => base44.entities.AnlageV.list('-tax_year')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Steuerdokumente</h1>
                    <p className="vf-page-subtitle">{anlagenV.length} Anlage V Formulare</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Calculator className="w-4 h-4" />
                        Neue Anlage V
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{anlagenV.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Anlage V</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Objekte</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{new Date().getFullYear()}</div>
                        <div className="text-sm opacity-90 mt-1">Steuerjahr</div>
                    </CardContent>
                </Card>
            </div>

            {anlagenV.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Calculator className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Keine Anlage V erstellt</h3>
                        <p className="text-gray-600 mb-6">Erstellen Sie Ihre erste Steuererklärung</p>
                        <Button className="vf-btn-gradient">
                            <Calculator className="w-4 h-4" />
                            Anlage V erstellen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {anlagenV.map((anlage) => {
                        const building = buildings.find(b => b.id === anlage.building_id);
                        return (
                            <Card key={anlage.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">
                                                    Anlage V {anlage.tax_year}
                                                </h3>
                                                <div className="text-sm text-gray-600">
                                                    {building?.name || 'Unbekanntes Gebäude'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span>Einnahmen: {anlage.total_rentals?.toLocaleString('de-DE')}€</span>
                                                    <span>•</span>
                                                    <span>Ausgaben: {anlage.total_expenses?.toLocaleString('de-DE')}€</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={
                                                anlage.status === 'SUBMITTED' ? 'vf-badge-success' :
                                                anlage.status === 'CALCULATED' ? 'vf-badge-info' :
                                                'vf-badge-default'
                                            }>
                                                {anlage.status || 'DRAFT'}
                                            </Badge>
                                            <Button variant="outline" size="sm">
                                                <Download className="w-4 h-4" />
                                            </Button>
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