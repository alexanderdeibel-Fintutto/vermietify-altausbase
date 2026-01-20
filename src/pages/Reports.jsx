import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Filter, Plus, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Reports() {
    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list('-created_date')
    });

    const reports = documents.filter(d => 
        ['Mietvertrag', 'Abrechnung', 'Übersicht'].some(type => d.dokumenttyp?.includes(type))
    );

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Berichte</h1>
                    <p className="vf-page-subtitle">Erstelle und verwalte Berichte</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neuen Bericht erstellen
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{reports.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Berichte gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {reports.filter(r => r.versand_status === 'Versendet').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Versendet</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {reports.filter(r => r.versand_status === 'Entwurf').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Entwürfe</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{reports.length}</div>
                        <div className="text-sm opacity-90 mt-1">Total verfügbar</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Verfügbare Berichte</h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Finanzübersicht', icon: BarChart3, type: 'Finanzbericht' },
                            { name: 'Mieteinzugsbericht', icon: FileText, type: 'Zahlungsbericht' },
                            { name: 'Wartungsbericht', icon: FileText, type: 'Wartung' },
                            { name: 'Compliance-Bericht', icon: FileText, type: 'Compliance' }
                        ].map((report, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <report.icon className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <div className="font-semibold">{report.name}</div>
                                            <div className="text-sm text-gray-600">{report.type}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline">
                                            <BarChart3 className="w-4 h-4" />
                                        </Button>
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

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Zuletzt erstellte Berichte</h3>
                    <div className="space-y-2">
                        {reports.slice(0, 10).map((report) => (
                            <div key={report.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm">{report.titel}</div>
                                    <div className="text-xs text-gray-600">
                                        {new Date(report.created_date).toLocaleDateString('de-DE')}
                                    </div>
                                </div>
                                <Badge className={
                                    report.versand_status === 'Versendet' ? 'vf-badge-success' :
                                    report.versand_status === 'Final' ? 'vf-badge-primary' :
                                    'vf-badge-default'
                                }>
                                    {report.versand_status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}