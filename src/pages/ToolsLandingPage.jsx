import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Calculator, TrendingUp, Home, PiggyBank, DollarSign, 
    FileText, Users, CheckCircle, BookOpen 
} from 'lucide-react';

const tools = [
    {
        icon: TrendingUp,
        title: 'Rendite-Rechner',
        description: 'Berechnen Sie die Rendite Ihrer Immobilieninvestition inkl. Eigenkapitalrendite',
        page: 'RenditeRechnerEnhanced',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        icon: Home,
        title: 'Kaufpreis-Rechner',
        description: 'Ermitteln Sie den maximalen Kaufpreis basierend auf gewünschter Rendite',
        page: 'KaufpreisRechnerV2',
        color: 'text-green-600',
        bg: 'bg-green-50'
    },
    {
        icon: TrendingUp,
        title: 'Indexmieten-Rechner',
        description: 'Berechnen Sie VPI-basierte Mietanpassungen nach österreichischem Recht',
        page: 'IndexmietenRechnerV2',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
    },
    {
        icon: PiggyBank,
        title: 'Tilgungs-Rechner',
        description: 'Kalkulation von Kreditraten, Laufzeit und Gesamtzinsen',
        page: 'TilgungsRechner',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    {
        icon: DollarSign,
        title: 'Cashflow-Rechner',
        description: 'Monatlicher und jährlicher Cashflow vor und nach Finanzierung',
        page: 'CashflowRechner',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
    {
        icon: TrendingUp,
        title: 'Wertentwicklungs-Rechner',
        description: 'Projizieren Sie die Wertentwicklung Ihrer Immobilie',
        page: 'WertentwicklungsRechner',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
    },
    {
        icon: Calculator,
        title: 'AfA-Rechner',
        description: 'Berechnen Sie die Abschreibung für Abnutzung (AfA)',
        page: 'AfACalculator',
        color: 'text-cyan-600',
        bg: 'bg-cyan-50'
    },
    {
        icon: FileText,
        title: 'Betriebskosten-Checker',
        description: 'Prüfen Sie Ihre Nebenkostenabrechnung auf Plausibilität',
        page: 'BKChecker',
        color: 'text-rose-600',
        bg: 'bg-rose-50'
    },
    {
        icon: BookOpen,
        title: 'Steuer-Guide Quiz',
        description: 'Testen Sie Ihr Wissen rund um Immobilienbesteuerung',
        page: 'SteuerGuideQuiz',
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    },
    {
        icon: Users,
        title: 'Investor-Profil Quiz',
        description: 'Finden Sie heraus, welcher Investor-Typ Sie sind',
        page: 'InvestorProfilQuizV2',
        color: 'text-teal-600',
        bg: 'bg-teal-50'
    }
];

export default function ToolsLandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Kostenlose Immobilien-Rechner
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Professionelle Tools für Investoren, Vermieter und Immobilieninteressierte
                    </p>
                    <p className="text-lg text-gray-500">
                        ✓ Keine Registrierung erforderlich  •  ✓ Kostenlos nutzbar  •  ✓ Sofortige Ergebnisse
                    </p>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool, idx) => {
                        const Icon = tool.icon;
                        return (
                            <Link key={idx} to={createPageUrl(tool.page)}>
                                <div className="vf-card vf-card-clickable h-full">
                                    <div className="vf-card-body">
                                        <div className={`w-14 h-14 rounded-xl ${tool.bg} flex items-center justify-center mb-4`}>
                                            <Icon className={`w-7 h-7 ${tool.color}`} />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">{tool.title}</h3>
                                        <p className="text-gray-600 text-sm">{tool.description}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-900 to-orange-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Mehr als nur Rechner</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Mit Vermitify erhalten Sie die komplette Immobilienverwaltung - 
                        von der Mieterverwaltung bis zur Steuererklärung
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link to={createPageUrl('VermitifyFeaturesEnhanced')}>
                            <Button className="vf-btn-lg" style={{ background: 'white', color: '#1E3A8A' }}>
                                Alle Features ansehen
                            </Button>
                        </Link>
                        <Link to={createPageUrl('VermitifySignup')}>
                            <Button variant="outline" className="vf-btn-lg" style={{ borderColor: 'white', color: 'white' }}>
                                Kostenlos starten
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}