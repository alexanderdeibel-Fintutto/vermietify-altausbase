import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calculator, TrendingUp, FileText, CheckCircle, Users, Zap, Shield, BarChart3 } from 'lucide-react';

export default function VermitifyHomepageEnhanced() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <div className="vf-hero vf-hero-gradient">
                <div className="max-w-5xl mx-auto px-6">
                    <h1 className="vf-hero-headline">
                        Immobilienverwaltung<br />leicht gemacht
                    </h1>
                    <p className="vf-hero-subheadline">
                        Die All-in-One Plattform für professionelle Vermieter. 
                        Verwalten Sie Ihre Immobilien effizient und rechtskonform.
                    </p>
                    <div className="vf-hero-ctas">
                        <Link to={createPageUrl('VermitifySignup')}>
                            <Button className="vf-btn-gradient vf-btn-lg">
                                Kostenlos starten
                            </Button>
                        </Link>
                        <Link to={createPageUrl('RenditeRechnerEnhanced')}>
                            <Button variant="outline" className="vf-btn-lg">
                                <Calculator className="w-5 h-5" />
                                Rendite berechnen
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="vf-features">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Alles, was Sie brauchen</h2>
                        <p className="text-xl text-gray-600">Eine Plattform für die gesamte Immobilienverwaltung</p>
                    </div>

                    <div className="vf-features-grid vf-features-grid-3">
                        <div className="vf-feature-card">
                            <div className="vf-feature-icon">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="vf-feature-title">Mieterverwaltung</h3>
                            <p className="vf-feature-description">
                                Verwalten Sie alle Mieterdaten zentral. Verträge, Kommunikation und Zahlungen im Blick.
                            </p>
                        </div>

                        <div className="vf-feature-card">
                            <div className="vf-feature-icon">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="vf-feature-title">Dokumentenverwaltung</h3>
                            <p className="vf-feature-description">
                                Alle wichtigen Dokumente digital und sicher. Automatische Generierung von Verträgen.
                            </p>
                        </div>

                        <div className="vf-feature-card">
                            <div className="vf-feature-icon">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="vf-feature-title">Finanzübersicht</h3>
                            <p className="vf-feature-description">
                                Mieteinnahmen, Ausgaben und Rendite auf einen Blick. Betriebskostenabrechnung per Klick.
                            </p>
                        </div>

                        <div className="vf-feature-card">
                            <div className="vf-feature-icon">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <h3 className="vf-feature-title">Steuer & AfA</h3>
                            <p className="vf-feature-description">
                                Automatische Anlage V Erstellung. AfA-Rechner und steueroptimierte Abschreibungen.
                            </p>
                        </div>

                        <div className="vf-feature-card">
                            <div className="vf-feature-icon">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="vf-feature-title">Automatisierung</h3>
                            <p className="vf-feature-description">
                                Automatische Zahlungserinnerungen, Fristenverwaltung und wiederkehrende Aufgaben.
                            </p>
                        </div>

                        <div className="vf-feature-card">
                            <div className="vf-feature-icon">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="vf-feature-title">Rechtssicherheit</h3>
                            <p className="vf-feature-description">
                                Aktuelle Gesetzestexte, Musterverträge und automatische Compliance-Checks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tools Section */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">Kostenlose Rechner</h2>
                        <p className="text-xl text-gray-600">Nutzen Sie unsere Tools ohne Registrierung</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Link to={createPageUrl('RenditeRechnerEnhanced')}>
                            <div className="vf-card vf-card-clickable">
                                <div className="vf-card-body text-center">
                                    <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">Rendite-Rechner</h3>
                                    <p className="text-sm text-gray-600">Berechnen Sie die Rendite Ihrer Investition</p>
                                </div>
                            </div>
                        </Link>

                        <Link to={createPageUrl('IndexmietenRechnerV2')}>
                            <div className="vf-card vf-card-clickable">
                                <div className="vf-card-body text-center">
                                    <TrendingUp className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">Indexmieten-Rechner</h3>
                                    <p className="text-sm text-gray-600">VPI-basierte Mietanpassung berechnen</p>
                                </div>
                            </div>
                        </Link>

                        <Link to={createPageUrl('AfACalculator')}>
                            <div className="vf-card vf-card-clickable">
                                <div className="vf-card-body text-center">
                                    <Calculator className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">AfA-Rechner</h3>
                                    <p className="text-sm text-gray-600">Abschreibung für Abnutzung ermitteln</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="vf-cta-section vf-cta-section-gradient">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="vf-cta-headline">Bereit loszulegen?</h2>
                    <p className="vf-cta-subheadline">
                        Starten Sie heute und verwalten Sie Ihre Immobilien professionell
                    </p>
                    <Link to={createPageUrl('VermitifySignup')}>
                        <Button className="vf-btn vf-btn-lg" style={{ background: 'white', color: '#1E3A8A' }}>
                            Jetzt kostenlos testen
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}