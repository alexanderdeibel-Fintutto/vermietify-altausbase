import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReportBuilder() {
    const [selectedReport, setSelectedReport] = useState(null);

    const { data: reports = [] } = useQuery({
        queryKey: ['reports'],
        queryFn: () => base44.entities.Report.list('-created_date')
    });

    const reportTypes = [
        { name: 'Finanzberichte', count: reports.filter(r => r.type === 'financial').length },
        { name: 'Gebäudeberichte', count: reports.filter(r => r.type === 'building').length },
        { name: 'Mieterberichte', count: reports.filter(r => r.type === 'tenant').length },
        { name: 'Nebenkosten', count: reports.filter(r => r.type === 'operating_costs').length }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Berichtsgenerator</h1>
                    <p className="vf-page-subtitle">{reports.length} Berichte erstellt</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Bericht
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Berichttypen</h3>
                        <div className="space-y-3">
                            {reportTypes.map((type, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                    <span className="font-semibold">{type.name}</span>
                                    <Badge className="vf-badge-primary">{type.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Schnellaktionen</h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                <FileText className="w-4 h-4 mr-2" />
                                Jahresbericht 2025
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <FileText className="w-4 h-4 mr-2" />
                                Quartalsabrechnung Q1
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <FileText className="w-4 h-4 mr-2" />
                                Mieterstatistik
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Berichte</h3>
                    <div className="space-y-2">
                        {reports.slice(0, 5).map((report) => (
                            <div key={report.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between hover:bg-gray-100 transition">
                                <div>
                                    <div className="font-semibold text-sm">{report.name}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Erstellt: {new Date(report.created_date).toLocaleDateString('de-DE')}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedReport(report)}>
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}