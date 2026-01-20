import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const testimonials = [
    {
        name: 'Michael Wagner',
        role: 'Privater Vermieter, 8 Einheiten',
        text: 'Vermitify hat meine Immobilienverwaltung revolutioniert. Die Betriebskostenabrechnung war früher ein Albtraum - jetzt mache ich sie in 30 Minuten.',
        rating: 5
    },
    {
        name: 'Sarah Huber',
        role: 'Hausverwaltung, 45 Einheiten',
        text: 'Endlich eine Software, die alle Funktionen bietet, die ich brauche. Besonders die Automatisierung spart mir enorm viel Zeit.',
        rating: 5
    },
    {
        name: 'Thomas Berger',
        role: 'Investor, 3 Gebäude',
        text: 'Die Renditeberechnungen und Cashflow-Analysen sind perfekt für meine Investitionsentscheidungen. Sehr zu empfehlen!',
        rating: 5
    },
    {
        name: 'Anna Schmid',
        role: 'Steuerberaterin',
        text: 'Meine Mandanten nutzen Vermitify und die Anlage V kommt perfekt strukturiert. Das spart uns beiden viel Zeit bei der Steuererklärung.',
        rating: 5
    },
    {
        name: 'Peter Gruber',
        role: 'Gewerbevermieter, 12 Objekte',
        text: 'Die Mieterverwaltung und Dokumentenverwaltung sind genau das, was ich gesucht habe. Alles an einem Ort, rechtssicher und übersichtlich.',
        rating: 5
    },
    {
        name: 'Lisa Moser',
        role: 'Private Vermieterin, 2 Wohnungen',
        text: 'Als Neueinsteigerin war ich überfordert mit der Verwaltung. Vermitify macht es mir leicht und ich fühle mich sicher.',
        rating: 5
    }
];

export default function VermitifyTestimonials() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Das sagen unsere Kunden
                    </h1>
                    <p className="text-xl text-gray-600">
                        Über 500 zufriedene Vermieter vertrauen auf Vermitify
                    </p>
                </div>
            </div>

            {/* Testimonials */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, idx) => (
                        <div key={idx} className="vf-testimonial-card">
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="vf-testimonial-quote">"{testimonial.text}"</p>
                            <div className="vf-testimonial-author">
                                <div className="vf-testimonial-avatar bg-gradient-to-br from-blue-900 to-orange-600 flex items-center justify-center text-white font-semibold">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="vf-testimonial-author-name">{testimonial.name}</div>
                                    <div className="vf-testimonial-author-role">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-900 to-orange-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Werden Sie Teil unserer Community</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Starten Sie jetzt und überzeugen Sie sich selbst
                    </p>
                    <Link to={createPageUrl('VermitifySignup')}>
                        <Button className="vf-btn-lg" style={{ background: 'white', color: '#1E3A8A' }}>
                            Kostenlos testen
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}