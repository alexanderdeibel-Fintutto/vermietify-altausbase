import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, FileText, Scale, Clock } from 'lucide-react';

const complianceItems = [
    { title: 'Grundsteuer', status: 'ok', dueDate: '2026-02-15', description: 'Frist eingehalten' },
    { title: 'Betriebskostenabrechnung', status: 'warning', dueDate: '2026-03-31', description: 'In 70 Tagen fällig' },
    { title: 'Rauchmelder-Wartung', status: 'ok', dueDate: '2026-06-01', description: 'Alle gewartet' },
    { title: 'Energieausweis', status: 'error', dueDate: '2026-01-31', description: 'Läuft bald ab!' }
];

export default function ComplianceCenter() {
    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Compliance Center</h1>
                    <p className="vf-page-subtitle">Gesetzliche Pflichten & Fristen</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-green-300 bg-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">2</div>
                        <div className="text-sm text-gray-700 mt-1">In Ordnung</div>
                    </CardContent>
                </Card>

                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">1</div>
                        <div className="text-sm text-gray-700 mt-1">Bald fällig</div>
                    </CardContent>
                </Card>

                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">1</div>
                        <div className="text-sm text-gray-700 mt-1">Dringend</div>
                    </CardContent>
                </Card>
            </div>

            {/* Compliance Items */}
            <div className="space-y-3">
                {complianceItems.map((item, idx) => (
                    <Card key={idx} className={
                        item.status === 'error' ? 'border-red-300 bg-red-50/50' :
                        item.status === 'warning' ? 'border-orange-300 bg-orange-50/50' :
                        'border-green-300 bg-green-50/50'
                    }>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                                        item.status === 'error' ? 'bg-red-600' :
                                        item.status === 'warning' ? 'bg-orange-600' :
                                        'bg-green-600'
                                    }`}>
                                        {item.status === 'ok' ? <CheckCircle className="w-5 h-5" /> :
                                         item.status === 'warning' ? <Clock className="w-5 h-5" /> :
                                         <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">{item.title}</h3>
                                        <p className="text-sm text-gray-700">{item.description}</p>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Frist: {new Date(item.dueDate).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                </div>
                                <Badge className={
                                    item.status === 'error' ? 'vf-badge-error' :
                                    item.status === 'warning' ? 'vf-badge-warning' :
                                    'vf-badge-success'
                                }>
                                    {item.status === 'ok' ? 'OK' :
                                     item.status === 'warning' ? 'Warnung' :
                                     'Dringend'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}