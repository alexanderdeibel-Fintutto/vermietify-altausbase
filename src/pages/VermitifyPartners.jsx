import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';

const partnerPrograms = [
    {
        icon: Briefcase,
        title: 'Steuerberater-Programm',
        description: 'Empfehlen Sie Vermitify Ihren Mandanten und erhalten Sie attraktive Provisionen',
        benefits: [
            '20% Provision auf alle Abonnements',
            'Dedizierter Partner-Manager',
            'Marketing-Materialien',
            'API-Zugang für Datenaustausch'
        ],
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        icon: Building2,
        title: 'Hausverwaltungs-Partner',
        description: 'White-Label-Lösung für professionelle Hausverwaltungen',
        benefits: [
            'Individuelles Branding',
            'Volumenlizenz-Rabatte',
            'Persönliches Onboarding',
            'Premium-Support'
        ],
        color: 'text-green-600',
        bg: 'bg-green-50'
    },
    {
        icon: GraduationCap,
        title: 'Bildungseinrichtungen',
        description: 'Spezielle Konditionen für Schulen und Universitäten',
        benefits: [
            '50% Bildungsrabatt',
            'Unbegrenzte Student-Accounts',
            'Schulungsmaterialien',
            'Akademische Lizenzen'
        ],
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    {
        icon: TrendingUp,
        title: 'Affiliate-Programm',
        description: 'Verdienen Sie mit jeder Empfehlung',
        benefits: [
            '30% wiederkehrende Provision',
            'Tracking-Dashboard',
            'Marketing-Assets',
            'Monatliche Auszahlung'
        ],
        color: 'text-orange-600',
        bg: 'bg-orange-50'
    }
];

export default function VermitifyPartners() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Partner-Programme
                    </h1>
                    <p className="text-xl text-gray-600">
                        Werden Sie Partner und profitieren Sie vom Wachstum von Vermitify
                    </p>
                </div>
            </div>

            {/* Partner Programs */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 gap-8">
                    {partnerPrograms.map((program, idx) => {
                        const Icon = program.icon;
                        return (
                            <Card key={idx}>
                                <CardHeader>
                                    <div className={`w-14 h-14 rounded-xl ${program.bg} flex items-center justify-center mb-4`}>
                                        <Icon className={`w-7 h-7 ${program.color}`} />
                                    </div>
                                    <CardTitle className="text-2xl mb-3">{program.title}</CardTitle>
                                    <p className="text-gray-600">{program.description}</p>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold mb-3">Vorteile:</h4>
                                    <ul className="space-y-2 mb-6">
                                        {program.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button className="vf-btn-gradient w-full">
                                        Partner werden
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-900 to-orange-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Interesse an einer Partnerschaft?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Lassen Sie uns gemeinsam wachsen
                    </p>
                    <Button className="vf-btn-lg" style={{ background: 'white', color: '#1E3A8A' }}>
                        Jetzt Partneranfrage senden
                    </Button>
                </div>
            </div>
        </div>
    );
}