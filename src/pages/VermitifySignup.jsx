import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { CheckCircle, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VermitifySignup() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        company: ''
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Building2 className="w-10 h-10 text-blue-900" />
                        <span className="text-3xl font-light tracking-wider text-gray-800">vermitify</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Kostenlos registrieren</h1>
                    <p className="text-gray-600">Starten Sie Ihre 14-tägige Testphase</p>
                </div>

                <div className="vf-card">
                    <div className="vf-card-body">
                        <form className="space-y-4">
                            <VfInput
                                label="Vollständiger Name"
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                required
                            />
                            <VfInput
                                label="E-Mail-Adresse"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                            <VfInput
                                label="Passwort"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                required
                                hint="Mindestens 8 Zeichen"
                            />
                            <VfInput
                                label="Firma (optional)"
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            />

                            <Button type="submit" className="vf-btn-gradient w-full">
                                Jetzt registrieren
                            </Button>
                        </form>

                        <div className="mt-6 space-y-3">
                            {['14 Tage kostenlos testen', 'Keine Kreditkarte erforderlich', 'Jederzeit kündbar'].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-600">Bereits registriert? </span>
                            <Link to={createPageUrl('VermitifyLogin')} className="text-blue-900 font-semibold hover:underline">
                                Jetzt anmelden
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                    Mit der Registrierung akzeptieren Sie unsere{' '}
                    <Link to={createPageUrl('VermitifyAGB')} className="underline">AGB</Link> und{' '}
                    <Link to={createPageUrl('VermitifyDatenschutz')} className="underline">Datenschutzerklärung</Link>
                </p>
            </div>
        </div>
    );
}