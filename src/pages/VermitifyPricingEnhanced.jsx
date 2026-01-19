import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Check, Zap } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price_monthly: 19,
        price_yearly: 190,
        description: 'Perfekt für Einsteiger',
        features: [
            'Bis zu 3 Gebäude',
            'Bis zu 10 Einheiten',
            'Unbegrenzt Mieter',
            'Dokumentenverwaltung',
            'Basis-Rechner',
            'E-Mail Support'
        ],
        highlighted: false
    },
    {
        name: 'Professional',
        price_monthly: 49,
        price_yearly: 490,
        description: 'Für professionelle Vermieter',
        features: [
            'Bis zu 15 Gebäude',
            'Bis zu 50 Einheiten',
            'Unbegrenzt Mieter',
            'Alle Rechner & Tools',
            'Betriebskosten-Wizard',
            'Anlage V Generator',
            'Bank-Integration',
            'Automatisierung',
            'Prioritäts-Support'
        ],
        highlighted: true
    },
    {
        name: 'Enterprise',
        price_monthly: 99,
        price_yearly: 990,
        description: 'Für Profis und Verwaltungen',
        features: [
            'Unbegrenzt Gebäude',
            'Unbegrenzt Einheiten',
            'Multi-Mandanten',
            'White-Label Option',
            'API-Zugang',
            'ELSTER-Integration',
            'Workflow-Automation',
            'Persönlicher Account Manager',
            'Telefon-Support'
        ],
        highlighted: false
    }
];

export default function VermitifyPricingEnhanced() {
    const [billingCycle, setBillingCycle] = useState('yearly');

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Transparent und fair
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Wählen Sie den Plan, der zu Ihnen passt. Jederzeit kündbar.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-3 bg-white rounded-full p-1 shadow-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full transition-all ${
                                billingCycle === 'monthly' 
                                    ? 'bg-gradient-to-r from-blue-900 to-orange-600 text-white' 
                                    : 'text-gray-600'
                            }`}
                        >
                            Monatlich
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 rounded-full transition-all ${
                                billingCycle === 'yearly' 
                                    ? 'bg-gradient-to-r from-blue-900 to-orange-600 text-white' 
                                    : 'text-gray-600'
                            }`}
                        >
                            Jährlich
                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">-20%</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-6 -mt-12 pb-20">
                <div className="vf-pricing-cards">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`vf-pricing-card ${plan.highlighted ? 'vf-pricing-card-highlighted' : ''}`}>
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-blue-900 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Beliebteste Wahl
                                    </div>
                                </div>
                            )}
                            
                            <div className="vf-pricing-name">{plan.name}</div>
                            <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                            
                            <div className="mb-6">
                                <span className="vf-pricing-price">
                                    {billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                                </span>
                                <span className="vf-pricing-period">
                                    {billingCycle === 'monthly' ? ' €/Monat' : ' €/Jahr'}
                                </span>
                            </div>

                            <ul className="vf-pricing-features">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="vf-pricing-feature">
                                        <Check className="vf-pricing-feature-check w-5 h-5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link to={createPageUrl('VermitifySignup')}>
                                <Button className={plan.highlighted ? 'vf-btn-gradient w-full' : 'w-full'}>
                                    {plan.name} wählen
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Häufig gestellte Fragen</h2>
                    
                    <div className="space-y-6">
                        <div className="vf-card">
                            <div className="vf-card-body">
                                <h3 className="font-semibold mb-2">Kann ich jederzeit kündigen?</h3>
                                <p className="text-gray-600">Ja, alle Pläne sind monatlich kündbar. Bei jährlicher Zahlung erhalten Sie 2 Monate gratis.</p>
                            </div>
                        </div>

                        <div className="vf-card">
                            <div className="vf-card-body">
                                <h3 className="font-semibold mb-2">Gibt es eine kostenlose Testphase?</h3>
                                <p className="text-gray-600">Ja, Sie können Vermitify 14 Tage kostenlos und unverbindlich testen.</p>
                            </div>
                        </div>

                        <div className="vf-card">
                            <div className="vf-card-body">
                                <h3 className="font-semibold mb-2">Kann ich meinen Plan später ändern?</h3>
                                <p className="text-gray-600">Ja, Sie können jederzeit upgraden oder downgraden. Die Abrechnung erfolgt anteilig.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}