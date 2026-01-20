import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Clock } from 'lucide-react';

const jobs = [
    {
        title: 'Senior Full-Stack Entwickler (m/w/d)',
        location: 'Wien / Remote',
        type: 'Vollzeit',
        department: 'Engineering',
        description: 'Entwicklung und Optimierung unserer React/Node.js basierten Plattform'
    },
    {
        title: 'Product Manager (m/w/d)',
        location: 'Wien',
        type: 'Vollzeit',
        department: 'Product',
        description: 'Steuerung der Produktentwicklung und Feature-Priorisierung'
    },
    {
        title: 'Customer Success Manager (m/w/d)',
        location: 'Remote',
        type: 'Vollzeit',
        department: 'Customer Success',
        description: 'Betreuung unserer Enterprise-Kunden und Onboarding-Prozesse'
    },
    {
        title: 'Marketing Manager (m/w/d)',
        location: 'Wien / Remote',
        type: 'Vollzeit',
        department: 'Marketing',
        description: 'Aufbau und Umsetzung unserer Marketing-Strategie'
    }
];

export default function VermitifyCareer() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Karriere bei Vermitify
                    </h1>
                    <p className="text-xl text-gray-600">
                        Werde Teil eines innovativen Teams und gestalte die Zukunft der Immobilienverwaltung
                    </p>
                </div>
            </div>

            {/* Why Join */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <h2 className="text-3xl font-bold mb-12 text-center">Warum Vermitify?</h2>
                
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                            🚀
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                        <p className="text-gray-600">
                            Arbeite an modernster Technologie und shape die PropTech-Branche
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                            🏡
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Flexibilität</h3>
                        <p className="text-gray-600">
                            Remote-Möglichkeiten, flexible Arbeitszeiten und moderne Tools
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                            📈
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Wachstum</h3>
                        <p className="text-gray-600">
                            Persönliche und berufliche Entwicklungsmöglichkeiten in einem Startup
                        </p>
                    </div>
                </div>

                {/* Open Positions */}
                <h2 className="text-3xl font-bold mb-8">Offene Positionen</h2>
                
                <div className="space-y-4">
                    {jobs.map((job, idx) => (
                        <Card key={idx} className="vf-card-clickable">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold mb-3">{job.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4">{job.description}</p>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            <Badge className="vf-badge-primary">
                                                <Briefcase className="w-3 h-3 mr-1" />
                                                {job.department}
                                            </Badge>
                                            <Badge className="vf-badge-default">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {job.location}
                                            </Badge>
                                            <Badge className="vf-badge-default">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {job.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <Button className="vf-btn-gradient ml-4">
                                        Bewerben
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Nichts Passendes dabei?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Wir sind immer auf der Suche nach talentierten Menschen. 
                        Sende uns eine Initiativbewerbung!
                    </p>
                    <Button className="vf-btn-gradient vf-btn-lg">
                        Initiativbewerbung senden
                    </Button>
                </div>
            </div>
        </div>
    );
}