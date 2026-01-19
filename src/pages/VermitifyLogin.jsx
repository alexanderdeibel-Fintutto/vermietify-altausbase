import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VermitifyLogin() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Building2 className="w-10 h-10 text-blue-900" />
                        <span className="text-3xl font-light tracking-wider text-gray-800">vermitify</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Willkommen zurück</h1>
                    <p className="text-gray-600">Melden Sie sich an, um fortzufahren</p>
                </div>

                <div className="vf-card">
                    <div className="vf-card-body">
                        <form className="space-y-4">
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
                            />

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="vf-checkbox" />
                                    <span className="text-gray-600">Angemeldet bleiben</span>
                                </label>
                                <a href="#" className="text-blue-900 hover:underline">Passwort vergessen?</a>
                            </div>

                            <Button type="submit" className="vf-btn-gradient w-full">
                                Anmelden
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-600">Noch kein Konto? </span>
                            <Link to={createPageUrl('VermitifySignup')} className="text-blue-900 font-semibold hover:underline">
                                Jetzt registrieren
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link to={createPageUrl('VermitifyHomepageEnhanced')} className="text-sm text-gray-600 hover:text-gray-800">
                        ← Zurück zur Startseite
                    </Link>
                </div>
            </div>
        </div>
    );
}