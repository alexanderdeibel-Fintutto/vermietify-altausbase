import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

const services = [
    { name: 'Webplattform', status: 'operational', uptime: '99.98%' },
    { name: 'API', status: 'operational', uptime: '99.95%' },
    { name: 'Datenbank', status: 'operational', uptime: '100%' },
    { name: 'Datei-Upload', status: 'operational', uptime: '99.92%' },
    { name: 'E-Mail-Versand', status: 'operational', uptime: '99.87%' },
    { name: 'PDF-Generierung', status: 'operational', uptime: '99.94%' }
];

const incidents = [
    {
        date: '15.01.2024',
        title: 'Geplante Wartung',
        status: 'resolved',
        description: 'Datenbank-Upgrade erfolgreich durchgeführt',
        duration: '2h 15min'
    },
    {
        date: '08.01.2024',
        title: 'Kurze Störung PDF-Export',
        status: 'resolved',
        description: 'Temporäre Überlastung bei PDF-Generierung',
        duration: '23min'
    }
];

export default function VermitifyStatusPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                        <h1 className="text-5xl font-bold vf-gradient-text">
                            Alle Systeme betriebsbereit
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600">
                        Aktuelle Verfügbarkeit unserer Dienste
                    </p>
                </div>
            </div>

            {/* Services Status */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <h2 className="text-2xl font-bold mb-6">System-Status</h2>
                
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {services.map((service, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-medium">{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">{service.uptime} Verfügbarkeit</span>
                                        <Badge className="vf-badge-success">Betriebsbereit</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Incidents */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Letzte Vorfälle</h2>
                    
                    <div className="space-y-4">
                        {incidents.map((incident, idx) => (
                            <Card key={idx}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <CardTitle className="text-lg">{incident.title}</CardTitle>
                                            </div>
                                            <p className="text-sm text-gray-500">{incident.date}</p>
                                        </div>
                                        <Badge className="vf-badge-success">Behoben</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                                    <p className="text-xs text-gray-500">Dauer: {incident.duration}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Uptime Stats */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Verfügbarkeit (letzte 90 Tage)</h2>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center">Gesamt</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-4xl font-bold text-green-600">99.96%</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center">Ausfallzeit</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-4xl font-bold">2h 38min</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center">Vorfälle</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-4xl font-bold">2</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}