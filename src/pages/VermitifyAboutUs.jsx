import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Heart, Target, Users } from 'lucide-react';

export default function VermitifyAboutUs() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Über Vermitify
                    </h1>
                    <p className="text-xl text-gray-600">
                        Wir machen Immobilienverwaltung einfach, effizient und rechtssicher
                    </p>
                </div>
            </div>

            {/* Story */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg max-w-none">
                    <h2 className="text-3xl font-bold mb-6">Unsere Geschichte</h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Vermitify wurde 2024 gegründet, weil wir selbst die Herausforderungen der Immobilienverwaltung 
                        kennengelernt haben. Als Vermieter mehrerer Objekte stießen wir immer wieder auf dieselben Probleme: 
                        verstreute Daten, komplizierte Betriebskostenabrechnungen, undurchsichtige Steuerformulare.
                    </p>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Wir dachten: Das muss einfacher gehen! Also haben wir Vermitify entwickelt - eine All-in-One 
                        Plattform, die alle Aspekte der Immobilienverwaltung vereint und dabei einfach zu bedienen bleibt.
                    </p>
                </div>

                {/* Values */}
                <div className="grid md:grid-cols-3 gap-8 mt-16">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Mission</h3>
                        <p className="text-gray-600">
                            Immobilienverwaltung für jeden zugänglich und professionell machen
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Werte</h3>
                        <p className="text-gray-600">
                            Transparenz, Einfachheit und Kundenzufriedenheit stehen bei uns an erster Stelle
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Team</h3>
                        <p className="text-gray-600">
                            Ein erfahrenes Team aus Entwicklern, Steuerberatern und Immobilienexperten
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-6">Bereit, Vermitify auszuprobieren?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Schließen Sie sich hunderten zufriedenen Vermietern an
                    </p>
                    <Link to={createPageUrl('VermitifySignup')}>
                        <Button className="vf-btn-gradient vf-btn-lg">
                            Jetzt kostenlos testen
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}