import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { CheckCircle, User, Mail, Phone, Calendar } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function TenantOnboarding() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        vorname: '',
        nachname: '',
        email: '',
        telefon: '',
        geburtsdatum: ''
    });

    const queryClient = useQueryClient();

    const createTenantMutation = useMutation({
        mutationFn: (data) => base44.entities.Tenant.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            setStep(3);
            showSuccess('Mieter erfolgreich angelegt');
        }
    });

    const handleNext = () => {
        if (step === 2) {
            createTenantMutation.mutate(formData);
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center py-6">
                <h1 className="text-3xl font-bold mb-2">Mieter-Onboarding</h1>
                <p className="text-gray-600">Schritt {step} von 3</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 w-24 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                ))}
            </div>

            {step === 1 && (
                <Card>
                    <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6">Persönliche Daten</h2>
                        <div className="space-y-4">
                            <VfInput
                                label="Vorname"
                                value={formData.vorname}
                                onChange={(e) => setFormData(prev => ({ ...prev, vorname: e.target.value }))}
                                leftIcon={User}
                                required
                            />
                            <VfInput
                                label="Nachname"
                                value={formData.nachname}
                                onChange={(e) => setFormData(prev => ({ ...prev, nachname: e.target.value }))}
                                leftIcon={User}
                                required
                            />
                            <VfInput
                                label="Geburtsdatum"
                                type="date"
                                value={formData.geburtsdatum}
                                onChange={(e) => setFormData(prev => ({ ...prev, geburtsdatum: e.target.value }))}
                                leftIcon={Calendar}
                            />
                        </div>
                        <Button className="vf-btn-gradient w-full mt-6" onClick={handleNext}>
                            Weiter
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6">Kontaktdaten</h2>
                        <div className="space-y-4">
                            <VfInput
                                label="E-Mail"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                leftIcon={Mail}
                                required
                            />
                            <VfInput
                                label="Telefon"
                                type="tel"
                                value={formData.telefon}
                                onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
                                leftIcon={Phone}
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                Zurück
                            </Button>
                            <Button className="vf-btn-gradient flex-1" onClick={handleNext}>
                                Mieter anlegen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Mieter erfolgreich angelegt!</h2>
                        <p className="text-gray-600 mb-8">
                            {formData.vorname} {formData.nachname} wurde erfolgreich als Mieter hinzugefügt.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => { setStep(1); setFormData({ vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' }); }}>
                                Weiteren Mieter anlegen
                            </Button>
                            <Button className="vf-btn-gradient flex-1">
                                Zur Übersicht
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}