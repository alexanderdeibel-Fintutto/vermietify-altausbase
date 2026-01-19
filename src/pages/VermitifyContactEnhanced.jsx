import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';

export default function VermitifyContactEnhanced() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await base44.functions.invoke('sendContactForm', formData);
            setSubmitted(true);
            showSuccess('Nachricht gesendet!');
        } catch (error) {
            showError('Fehler beim Senden');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-6">
                <div className="text-center max-w-md">
                    <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Vielen Dank!</h1>
                    <p className="text-gray-600 mb-6">
                        Ihre Nachricht wurde erfolgreich versendet. Wir melden uns in Kürze bei Ihnen.
                    </p>
                    <Button onClick={() => window.location.href = '/'} className="vf-btn-gradient">
                        Zur Startseite
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-20">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-4 vf-gradient-text">Kontaktieren Sie uns</h1>
                    <p className="text-xl text-gray-600">Wir freuen uns auf Ihre Nachricht</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="vf-card">
                        <div className="vf-card-body">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="E-Mail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Telefon"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                                <VfInput
                                    label="Firma (optional)"
                                    value={formData.company}
                                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                />
                                <VfInput
                                    label="Betreff"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    required
                                />
                                <VfTextarea
                                    label="Nachricht"
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    rows={6}
                                    required
                                />

                                <Button type="submit" disabled={loading} className="vf-btn-gradient w-full">
                                    <Send className="w-4 h-4" />
                                    {loading ? 'Wird gesendet...' : 'Nachricht senden'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="vf-card">
                            <div className="vf-card-body">
                                <div className="flex gap-4">
                                    <div className="vf-tool-icon w-12 h-12 flex-shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">E-Mail</h3>
                                        <p className="text-gray-600">kontakt@vermitify.com</p>
                                        <p className="text-sm text-gray-500 mt-1">Wir antworten innerhalb von 24 Stunden</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vf-card">
                            <div className="vf-card-body">
                                <div className="flex gap-4">
                                    <div className="vf-tool-icon w-12 h-12 flex-shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Telefon</h3>
                                        <p className="text-gray-600">+43 1 234 5678</p>
                                        <p className="text-sm text-gray-500 mt-1">Mo-Fr: 9:00 - 18:00 Uhr</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vf-card">
                            <div className="vf-card-body">
                                <div className="flex gap-4">
                                    <div className="vf-tool-icon w-12 h-12 flex-shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Adresse</h3>
                                        <p className="text-gray-600">
                                            Vermitify GmbH<br />
                                            Beispielstraße 123<br />
                                            1010 Wien, Österreich
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}