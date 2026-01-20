import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, ArrowRight, Calendar, CreditCard } from 'lucide-react';

export default function MySubscription() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: subscription } = useQuery({
        queryKey: ['userSubscription'],
        queryFn: async () => {
            const subs = await base44.entities.UserSubscription.filter({ user_email: user?.email });
            return subs[0];
        },
        enabled: !!user?.email
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['subscriptionPlans'],
        queryFn: () => base44.entities.SubscriptionPlan.list('display_order')
    });

    return (
        <div className="max-w-6xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mein Abonnement</h1>
                    <p className="vf-page-subtitle">Verwalten Sie Ihr Vermitify-Abonnement</p>
                </div>
            </div>

            {/* Current Plan */}
            {subscription && (
                <Card className="border-2 border-blue-600">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Ihr aktueller Plan</CardTitle>
                            <Badge className="vf-badge-gradient">
                                <Crown className="w-3 h-3 mr-1" />
                                {subscription.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Abrechnungszyklus</div>
                                <div className="font-semibold">{subscription.billing_cycle === 'MONTHLY' ? 'Monatlich' : 'Jährlich'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Nächste Abrechnung</div>
                                <div className="font-semibold flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(subscription.next_billing_date).toLocaleDateString('de-DE')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Zahlungsmethode</div>
                                <div className="font-semibold flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    {subscription.payment_method === 'CREDIT_CARD' ? 'Kreditkarte' : subscription.payment_method}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Available Plans */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Verfügbare Pläne</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const features = JSON.parse(plan.features || '[]');
                        const isCurrentPlan = subscription?.plan_id === plan.id;

                        return (
                            <Card key={plan.id} className={isCurrentPlan ? 'border-2 border-blue-600' : ''}>
                                <CardContent className="p-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                        <div className="text-4xl font-bold text-blue-900 mb-1">
                                            {plan.price_monthly}€
                                        </div>
                                        <div className="text-sm text-gray-600">pro Monat</div>
                                        {plan.price_yearly && (
                                            <div className="text-sm text-green-600 mt-1">
                                                {plan.price_yearly}€ / Jahr (spare {((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12) * 100).toFixed(0)}%)
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{plan.max_buildings === -1 ? 'Unbegrenzt' : plan.max_buildings} Gebäude</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{plan.max_units === -1 ? 'Unbegrenzt' : plan.max_units} Einheiten</span>
                                        </div>
                                        {features.slice(0, 3).map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-green-600" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {isCurrentPlan ? (
                                        <Button disabled className="w-full" variant="outline">
                                            Aktueller Plan
                                        </Button>
                                    ) : (
                                        <Button className="w-full vf-btn-gradient">
                                            Upgraden
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}