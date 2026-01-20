import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const features = [
    { name: 'Mieterverwaltung', vermitify: true, competitor1: true, competitor2: true },
    { name: 'Automatische BK-Abrechnung', vermitify: true, competitor1: false, competitor2: true },
    { name: 'Anlage V Generator', vermitify: true, competitor1: false, competitor2: false },
    { name: 'ELSTER-Integration', vermitify: true, competitor1: false, competitor2: false },
    { name: 'KI-Dokumentenerkennung', vermitify: true, competitor1: false, competitor2: false },
    { name: 'Mieterportal', vermitify: true, competitor1: true, competitor2: false },
    { name: 'Mobile App', vermitify: true, competitor1: false, competitor2: true },
    { name: 'WhatsApp-Integration', vermitify: true, competitor1: false, competitor2: false },
    { name: 'Kostenlose Tools', vermitify: true, competitor1: false, competitor2: false },
    { name: 'DSGVO-konform', vermitify: true, competitor1: true, competitor2: true },
    { name: 'Deutscher Support', vermitify: true, competitor1: true, competitor2: false },
    { name: 'Preis/Monat (ab)', vermitify: '19€', competitor1: '49€', competitor2: '29€' }
];

export default function VermitifyComparison() {
    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Vermitify im Vergleich
                    </h1>
                    <p className="text-xl text-gray-600">
                        Sehen Sie, warum Vermitify die beste Wahl ist
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="overflow-x-auto">
                    <table className="vf-table w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Feature</th>
                                <th className="text-center">
                                    <div className="font-bold text-blue-900">Vermitify</div>
                                </th>
                                <th className="text-center text-gray-500">Anbieter A</th>
                                <th className="text-center text-gray-500">Anbieter B</th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature, idx) => (
                                <tr key={idx}>
                                    <td className="font-medium">{feature.name}</td>
                                    <td className="text-center">
                                        {typeof feature.vermitify === 'boolean' ? (
                                            feature.vermitify ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                                            )
                                        ) : (
                                            <span className="font-bold text-green-600">{feature.vermitify}</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {typeof feature.competitor1 === 'boolean' ? (
                                            feature.competitor1 ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-gray-600">{feature.competitor1}</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {typeof feature.competitor2 === 'boolean' ? (
                                            feature.competitor2 ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-gray-600">{feature.competitor2}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-12">
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