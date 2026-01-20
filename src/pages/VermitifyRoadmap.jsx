import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Zap } from 'lucide-react';

const roadmapItems = [
    {
        status: 'completed',
        quarter: 'Q4 2023',
        features: [
            'Basis Mieterverwaltung',
            'Dokumentenmanagement',
            'Finanzübersicht',
            'Anlage V Export'
        ]
    },
    {
        status: 'completed',
        quarter: 'Q1 2024',
        features: [
            'Betriebskostenabrechnung Wizard',
            'Mobile Optimierung',
            'Automatische Mahnungen',
            'SEPA-Integration'
        ]
    },
    {
        status: 'in-progress',
        quarter: 'Q2 2024',
        features: [
            'KI-gestützte Dokumentenerkennung',
            'Mieterportal',
            'WhatsApp-Integration',
            'Banking-Synchronisation'
        ]
    },
    {
        status: 'planned',
        quarter: 'Q3 2024',
        features: [
            'ELSTER-Direktübermittlung',
            'Predictive Analytics',
            'Multi-Mandanten-Fähigkeit',
            'API für Drittanbieter'
        ]
    },
    {
        status: 'planned',
        quarter: 'Q4 2024',
        features: [
            'IoT-Integration (Smart Home)',
            'Blockchain-Mietverträge',
            'AR-Wohnungsbesichtigungen',
            'White-Label-Lösung'
        ]
    }
];

export default function VermitifyRoadmap() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Produkt-Roadmap
                    </h1>
                    <p className="text-xl text-gray-600">
                        Sehen Sie, woran wir arbeiten und was als nächstes kommt
                    </p>
                </div>
            </div>

            {/* Roadmap */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="space-y-6">
                    {roadmapItems.map((item, idx) => (
                        <Card key={idx} className={item.status === 'in-progress' ? 'border-2 border-blue-600' : ''}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {item.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-600" />}
                                        {item.status === 'in-progress' && <Zap className="w-6 h-6 text-blue-600" />}
                                        {item.status === 'planned' && <Clock className="w-6 h-6 text-gray-400" />}
                                        <CardTitle>{item.quarter}</CardTitle>
                                    </div>
                                    <Badge className={
                                        item.status === 'completed' ? 'vf-badge-success' :
                                        item.status === 'in-progress' ? 'vf-badge-info' :
                                        'vf-badge-default'
                                    }>
                                        {item.status === 'completed' ? 'Abgeschlossen' :
                                         item.status === 'in-progress' ? 'In Arbeit' :
                                         'Geplant'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {item.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                                item.status === 'completed' ? 'text-green-600' : 'text-gray-300'
                                            }`} />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Feature Request */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Wünschen Sie eine Funktion?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Teilen Sie uns Ihre Ideen mit - wir hören auf unsere Nutzer!
                    </p>
                    <Link to={createPageUrl('VermitifyContactEnhanced')}>
                        <Button className="vf-btn-gradient vf-btn-lg">
                            Feature vorschlagen
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}