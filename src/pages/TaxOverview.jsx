import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calculator, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TaxOverview() {
    const { data: anlageV = [] } = useQuery({
        queryKey: ['anlageV'],
        queryFn: () => base44.entities.AnlageV.list('-tax_year')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const totalIncome = anlageV.reduce((sum, a) => sum + (parseFloat(a.total_rentals) || 0), 0);
    const totalExpenses = anlageV.reduce((sum, a) => sum + (parseFloat(a.total_expenses) || 0), 0);
    const netIncome = totalIncome - totalExpenses;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Steuerübersicht</h1>
                    <p className="vf-page-subtitle">Anlage V & Steuererklärungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Calculator className="w-4 h-4 mr-2" />
                        Neue Anlage V
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{anlageV.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Steuerformulare</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{totalIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Einkünfte</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Werbungskosten</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{netIncome.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Netto-Einkünfte</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Anlage V nach Jahr</h3>
                    <div className="space-y-2">
                        {anlageV.map((form) => {
                            const building = buildings.find(b => b.id === form.building_id);
                            return (
                                <div key={form.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{building?.name || 'Unbekannt'}</div>
                                            <div className="text-sm text-gray-600">Steuerjahr {form.tax_year}</div>
                                        </div>
                                        <Badge className={
                                            form.status === 'SUBMITTED' ? 'vf-badge-success' : 
                                            form.status === 'CALCULATED' ? 'vf-badge-primary' : 
                                            'vf-badge-default'
                                        }>
                                            {form.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Einnahmen</div>
                                            <div className="font-semibold text-green-700">{form.total_rentals?.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Ausgaben</div>
                                            <div className="font-semibold text-red-700">{form.total_expenses?.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Netto</div>
                                            <div className="font-semibold">{form.net_income?.toLocaleString('de-DE')}€</div>
                                        </div>
                                    </div>
                                    {form.pdf_url && (
                                        <Button size="sm" variant="outline" className="mt-3">
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF herunterladen
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}