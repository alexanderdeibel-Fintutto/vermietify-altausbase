import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Users } from 'lucide-react';

const caseStudies = [
    {
        company: 'Immobilien Wagner GmbH',
        industry: 'Gewerbeverwaltung',
        units: '120 Einheiten',
        challenge: 'Unübersichtliche Excel-Listen, manuelle BK-Abrechnungen dauerten Wochen',
        solution: 'Migration zu Vermitify mit vollautomatisierter BK-Abrechnung',
        results: [
            { label: 'Zeitersparnis', value: '85%', icon: Clock },
            { label: 'Fehlerreduktion', value: '95%', icon: TrendingUp },
            { label: 'Zufriedenheit', value: '98%', icon: Users }
        ],
        quote: 'Vermitify hat unsere Verwaltung revolutioniert. Die BK-Abrechnung ist jetzt in 2 Stunden statt 2 Wochen erledigt.',
        author: 'Michael Wagner, Geschäftsführer'
    },
    {
        company: 'Huber Immobilien',
        industry: 'Wohnungsverwaltung',
        units: '45 Einheiten',
        challenge: 'Verstreute Dokumente, fehlende Übersicht über Finanzen',
        solution: 'Zentralisierung aller Prozesse in Vermitify',
        results: [
            { label: 'Zeitersparnis', value: '70%', icon: Clock },
            { label: 'Kosteneinsparung', value: '12.000€/Jahr', icon: TrendingUp },
            { label: 'Mieterzufriedenheit', value: '+35%', icon: Users }
        ],
        quote: 'Endlich habe ich alle Dokumente und Finanzen an einem Ort. Das spart nicht nur Zeit, sondern gibt mir auch Sicherheit.',
        author: 'Sarah Huber, Inhaberin'
    },
    {
        company: 'Investmentgroup Berger',
        industry: 'Immobilieninvestor',
        units: '8 Gebäude',
        challenge: 'Komplexe Portfolio-Analyse, manuelle Renditeberechnungen',
        solution: 'Vermitify als zentrale Analyse- und Verwaltungsplattform',
        results: [
            { label: 'ROI-Steigerung', value: '+18%', icon: TrendingUp },
            { label: 'Analysezeit', value: '-90%', icon: Clock },
            { label: 'Transparenz', value: '100%', icon: Users }
        ],
        quote: 'Die Rendite-Analysen und Portfolio-Übersichten helfen mir bei fundierten Investitionsentscheidungen.',
        author: 'Thomas Berger, CEO'
    }
];

export default function VermitifyCaseStudies() {
    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Erfolgsgeschichten
                    </h1>
                    <p className="text-xl text-gray-600">
                        Wie unsere Kunden mit Vermitify erfolgreich sind
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-20 space-y-16">
                {caseStudies.map((study, idx) => (
                    <Card key={idx} className="overflow-hidden">
                        <CardHeader className="bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-2xl mb-2">{study.company}</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge className="vf-badge-primary">{study.industry}</Badge>
                                        <Badge className="vf-badge-default">{study.units}</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">Herausforderung</h3>
                                    <p className="text-gray-700">{study.challenge}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">Lösung</h3>
                                    <p className="text-gray-700">{study.solution}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-semibold text-sm text-gray-500 uppercase mb-4">Ergebnisse</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {study.results.map((result, i) => {
                                        const Icon = result.icon;
                                        return (
                                            <div key={i} className="text-center">
                                                <Icon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                                <p className="text-2xl font-bold text-blue-900">{result.value}</p>
                                                <p className="text-xs text-gray-500 mt-1">{result.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                                <p className="text-gray-700 italic mb-2">"{study.quote}"</p>
                                <p className="text-sm text-gray-600">— {study.author}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ihre Erfolgsgeschichte beginnt hier</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Schließen Sie sich unseren zufriedenen Kunden an
                    </p>
                    <Link to={createPageUrl('VermitifySignup')}>
                        <Button className="vf-btn-gradient vf-btn-lg">
                            Kostenlos starten
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}