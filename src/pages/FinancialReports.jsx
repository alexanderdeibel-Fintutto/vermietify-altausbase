import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, BarChart3, Calendar } from 'lucide-react';

export default function FinancialReports() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const income = contracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0) * 12;
    const expenses = invoices.reduce((sum, i) => sum + parseFloat(i.betrag || 0), 0);

    const reports = [
        { name: 'Jahresübersicht 2025', type: 'Jahresbericht', date: '2025-01-01' },
        { name: 'Quartalsabrechnung Q4', type: 'Quartalsabrechnung', date: '2024-12-31' },
        { name: 'Mieteinnahmen-Report', type: 'Finanzbericht', date: '2025-01-15' },
        { name: 'Kostenübersicht', type: 'Kostenanalyse', date: '2025-01-10' }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzberichte</h1>
                    <p className="vf-page-subtitle">Auswertungen & Exporte</p>
                </div>
                <Button className="vf-btn-gradient">
                    <FileText className="w-4 h-4 mr-2" />
                    Neuen Bericht erstellen
                </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{income.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahreseinnahmen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-700">{expenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresausgaben</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(income - expenses).toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gewinn</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{reports.length}</div>
                        <div className="text-sm opacity-90 mt-1">Berichte verfügbar</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Verfügbare Berichte</h3>
                    <div className="space-y-2">
                        {reports.map((report, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <div className="font-semibold">{report.name}</div>
                                            <div className="text-sm text-gray-600">{report.type}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">{new Date(report.date).toLocaleDateString('de-DE')}</span>
                                        <Button size="sm" variant="outline">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}