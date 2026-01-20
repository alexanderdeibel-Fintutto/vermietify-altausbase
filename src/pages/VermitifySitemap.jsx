import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const sitemapSections = [
    {
        title: 'Hauptseiten',
        links: [
            { label: 'Startseite', page: 'VermitifyHomepageEnhanced' },
            { label: 'Features', page: 'VermitifyFeaturesEnhanced' },
            { label: 'Preise', page: 'VermitifyPricingEnhanced' },
            { label: 'Über uns', page: 'VermitifyAboutUs' },
            { label: 'Kontakt', page: 'VermitifyContactEnhanced' }
        ]
    },
    {
        title: 'Kostenlose Tools',
        links: [
            { label: 'Tool-Übersicht', page: 'ToolsLandingPage' },
            { label: 'Rendite-Rechner', page: 'RenditeRechnerEnhanced' },
            { label: 'Indexmieten-Rechner', page: 'IndexmietenRechnerV2' },
            { label: 'Kaufpreis-Rechner', page: 'KaufpreisRechnerV2' },
            { label: 'AfA-Rechner', page: 'AfACalculator' },
            { label: 'BK-Checker', page: 'BKChecker' },
            { label: 'Cashflow-Rechner', page: 'CashflowRechner' },
            { label: 'Tilgungs-Rechner', page: 'TilgungsRechner' }
        ]
    },
    {
        title: 'Ressourcen',
        links: [
            { label: 'Blog', page: 'VermitifyBlog' },
            { label: 'FAQ', page: 'VermitifyFAQ' },
            { label: 'Support', page: 'VermitifySupport' },
            { label: 'Roadmap', page: 'VermitifyRoadmap' },
            { label: 'Changelog', page: 'VermitifyChangelog' },
            { label: 'Status', page: 'VermitifyStatusPage' }
        ]
    },
    {
        title: 'Rechtliches',
        links: [
            { label: 'Impressum', page: 'VermitifyImpressum' },
            { label: 'Datenschutz', page: 'VermitifyDatenschutz' },
            { label: 'AGB', page: 'VermitifyAGB' }
        ]
    },
    {
        title: 'Account',
        links: [
            { label: 'Registrieren', page: 'VermitifySignup' },
            { label: 'Anmelden', page: 'VermitifyLogin' }
        ]
    }
];

export default function VermitifySitemap() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Sitemap
                    </h1>
                    <p className="text-xl text-gray-600">
                        Alle Seiten im Überblick
                    </p>
                </div>
            </div>

            {/* Sitemap */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {sitemapSections.map((section, idx) => (
                        <div key={idx}>
                            <h2 className="text-xl font-bold mb-4 text-gray-900">{section.title}</h2>
                            <ul className="space-y-2">
                                {section.links.map((link, i) => (
                                    <li key={i}>
                                        <Link 
                                            to={createPageUrl(link.page)}
                                            className="text-gray-600 hover:text-blue-600 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}