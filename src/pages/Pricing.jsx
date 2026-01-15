import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('MONTHLY');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const { data: plans } = useQuery({
        queryKey: ['subscriptionPlans'],
        queryFn: () => base44.entities.SubscriptionPlan.filter({ is_active: true }),
        initialData: []
    });

    const features = [
        { code: 'basic_management', label: 'Grundverwaltung' },
        { code: 'document_upload', label: 'Dokumente hochladen' },
        { code: 'invoice_generation', label: 'Rechnungen erstellen' },
        { code: 'bank_sync', label: 'Bank-Synchronisation' },
        { code: 'ocr_basic', label: 'OCR (Standard)' },
        { code: 'ocr_pro', label: 'OCR (Pro)' },
        { code: 'datev_export', label: 'DATEV-Export' },
        { code: 'api_access', label: 'API-Zugriff' }
    ];

    const handleSelectPlan = async (planId) => {
        setIsLoading(true);
        try {
            const response = await base44.functions.invoke('createStripeCheckoutSession', {
                planId,
                billingCycle
            });
            if (response.data?.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Checkout-Fehler:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Einfache, transparente Preise</h1>
                    <p className="text-xl text-gray-600 mb-8">Wähle den perfekten Plan für deine Immobilien</p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <button
                            onClick={() => setBillingCycle('MONTHLY')}
                            className={`px-4 py-2 rounded-lg transition ${
                                billingCycle === 'MONTHLY'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700'
                            }`}
                        >
                            Monatlich
                        </button>
                        <button
                            onClick={() => setBillingCycle('YEARLY')}
                            className={`px-4 py-2 rounded-lg transition ${
                                billingCycle === 'YEARLY'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700'
                            }`}
                        >
                            Jährlich <span className="text-xs ml-2 text-green-600">Spare 2 Monate</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    {plans.map((plan) => {
                        const features_array = JSON.parse(plan.features || '[]');
                        const price = billingCycle === 'YEARLY' ? (plan.price_yearly || plan.price_monthly * 12) : plan.price_monthly;

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-xl transition transform hover:scale-105 ${
                                    plan.internal_code === 'PRO'
                                        ? 'bg-blue-600 text-white shadow-2xl ring-2 ring-blue-400'
                                        : 'bg-white text-gray-900 shadow-lg'
                                }`}
                            >
                                <div className="p-6">
                                    {plan.internal_code === 'PRO' && (
                                        <div className="bg-yellow-400 text-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">
                                            ⭐ Empfohlen
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className={`text-4xl font-bold mb-2`}>
                                        €{price.toFixed(2)}
                                    </p>
                                    <p className={`text-sm mb-6 ${plan.internal_code === 'PRO' ? 'text-blue-100' : 'text-gray-600'}`}>
                                        pro {billingCycle === 'YEARLY' ? 'Jahr' : 'Monat'}
                                    </p>

                                    {/* Features List */}
                                    <ul className="space-y-3 mb-8 text-sm">
                                        <li className="flex gap-2">
                                            <span className="font-bold">{plan.max_buildings === -1 ? '∞' : plan.max_buildings}</span>
                                            <span>Gebäude</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="font-bold">{plan.max_units === -1 ? '∞' : plan.max_units}</span>
                                            <span>Einheiten</span>
                                        </li>
                                        {features.map((f) => (
                                            <li key={f.code} className="flex items-center gap-2">
                                                {features_array.includes(f.code) ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <X className={`w-4 h-4 ${plan.internal_code === 'PRO' ? 'text-blue-300' : 'text-gray-300'}`} />
                                                )}
                                                <span className={features_array.includes(f.code) ? '' : plan.internal_code === 'PRO' ? 'text-blue-200' : 'text-gray-400'}>
                                                    {f.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={isLoading}
                                        className={`w-full ${
                                            plan.internal_code === 'PRO'
                                                ? 'bg-white text-blue-600 hover:bg-gray-100'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        Jetzt starten
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold mb-6">Häufig gestellte Fragen</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Kann ich später wechseln?</h3>
                            <p className="text-gray-600">Ja, du kannst jederzeit zwischen Tarifen wechseln. Die Abrechnung wird proportional angepasst.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Gibt es eine kostenloses Trial?</h3>
                            <p className="text-gray-600">Der Starter-Tarif ist kostenlos und unbegrenzt nutzbar. Perfekt zum Ausprobieren.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Wie funktioniert die Abrechnung?</h3>
                            <p className="text-gray-600">Monatlich oder jährlich. Jederzeit kündbar. Keine Verträge, keine versteckten Kosten.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}