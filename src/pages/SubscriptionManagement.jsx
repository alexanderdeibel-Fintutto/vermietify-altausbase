import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionManagement() {
    const { data: subscription } = useQuery({
        queryKey: ['userSubscription'],
        queryFn: async () => {
            const user = await base44.auth.me();
            const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
            return subs[0];
        }
    });

    const { data: plan } = useQuery({
        queryKey: ['subscriptionPlan', subscription?.plan_id],
        queryFn: () => subscription ? base44.entities.SubscriptionPlan.read(subscription.plan_id) : null,
        enabled: !!subscription
    });

    if (!subscription || !plan) {
        return (
            <div className="space-y-6">
                <div className="vf-page-header">
                    <h1 className="vf-page-title">Abonnement</h1>
                </div>
                <Card className="text-center p-12">
                    <AlertCircle className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">Kein aktives Abonnement gefunden</p>
                </Card>
            </div>
        );
    }

    const daysLeft = subscription.end_date 
        ? Math.ceil((new Date(subscription.end_date) - new Date()) / (24 * 60 * 60 * 1000))
        : null;

    const features = plan.features ? JSON.parse(plan.features) : [];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Abonnement</h1>
                    <p className="vf-page-subtitle">{plan.name}</p>
                </div>
            </div>

            <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <div className="text-lg opacity-90 mb-2">Aktueller Plan</div>
                            <div className="text-4xl font-bold">{plan.name}</div>
                            <div className="text-lg opacity-90 mt-2">
                                {subscription.billing_cycle === 'MONTHLY' ? plan.price_monthly : plan.price_yearly}€/{subscription.billing_cycle === 'MONTHLY' ? 'Monat' : 'Jahr'}
                            </div>
                        </div>
                        <div>
                            <div className="text-lg opacity-90 mb-2">Status</div>
                            <Badge className="bg-green-500 text-white text-lg px-4 py-2 mb-4">
                                {subscription.status === 'ACTIVE' ? 'Aktiv' : subscription.status}
                            </Badge>
                            {daysLeft && daysLeft > 0 && (
                                <div className="text-sm opacity-90">
                                    Erneuert am: {new Date(subscription.next_billing_date).toLocaleDateString('de-DE')}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-lg opacity-90 mb-2">Abrechnungszyklus</div>
                            <div className="text-3xl font-bold">
                                {subscription.billing_cycle === 'MONTHLY' ? 'Monatlich' : 'Jährlich'}
                            </div>
                            {subscription.billing_cycle === 'YEARLY' && (
                                <div className="text-sm opacity-90 mt-2">Du sparst {(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)}€/Jahr</div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Limits</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Gebäude</span>
                                <span className="font-semibold">{plan.max_buildings === -1 ? 'Unbegrenzt' : plan.max_buildings}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Einheiten</span>
                                <span className="font-semibold">{plan.max_units === -1 ? 'Unbegrenzt' : plan.max_units}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Features</h3>
                        <div className="space-y-2">
                            {features.slice(0, 5).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                            {features.length > 5 && (
                                <div className="text-xs text-gray-600 mt-2">
                                    +{features.length - 5} weitere Features
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Zahlungsmethode</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                <span className="text-sm capitalize">{subscription.payment_method}</span>
                            </div>
                            <Button variant="outline" className="w-full">
                                Zahlungsmethode ändern
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Plan verwalten</h3>
                    <div className="flex gap-3 flex-wrap">
                        <Button className="vf-btn-primary">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade Plan
                        </Button>
                        <Button variant="outline">
                            Abonnement pausieren
                        </Button>
                        <Button variant="outline">
                            Kontakt Support
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}