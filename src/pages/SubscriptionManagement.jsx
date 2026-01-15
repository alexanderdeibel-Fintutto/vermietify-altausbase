import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionManagement() {
    const navigate = useNavigate();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        initialData: null
    });

    const { data: subscription } = useQuery({
        queryKey: ['userSubscription', user?.email],
        queryFn: () => {
            if (!user?.email) return null;
            return base44.entities.UserSubscription.filter({
                user_email: user.email,
                status: { $in: ['ACTIVE', 'TRIAL'] }
            }).then(subs => subs[0] || null);
        },
        enabled: !!user?.email,
        initialData: null
    });

    const { data: plan } = useQuery({
        queryKey: ['subscriptionPlan', subscription?.plan_id],
        queryFn: () => subscription ? base44.entities.SubscriptionPlan.get(subscription.plan_id) : null,
        enabled: !!subscription?.plan_id,
        initialData: null
    });

    const { data: buildings } = useQuery({
        queryKey: ['userBuildings', user?.email],
        queryFn: () => {
            if (!user?.email) return [];
            return base44.entities.Building.filter({ created_by: user.email });
        },
        enabled: !!user?.email,
        initialData: []
    });

    const { data: units } = useQuery({
        queryKey: ['userUnits', user?.email],
        queryFn: () => {
            if (!user?.email) return [];
            return base44.entities.Unit.filter({ created_by: user.email });
        },
        enabled: !!user?.email,
        initialData: []
    });

    if (!user || !subscription || !plan) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-3xl mx-auto">
                    <Card className="text-center p-12">
                        <CardTitle className="mb-4">Kein aktives Abo</CardTitle>
                        <p className="text-gray-600 mb-6">Du hast noch keinen Tarif gewählt.</p>
                        <Button onClick={() => navigate(createPageUrl('Pricing'))}>
                            Tarif wählen
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const buildingUsage = (buildings.length / (plan.max_buildings === -1 ? 999 : plan.max_buildings)) * 100;
    const unitUsage = (units.length / (plan.max_units === -1 ? 999 : plan.max_units)) * 100;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Current Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dein aktueller Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-blue-600">{plan.name}</h3>
                                <p className="text-gray-600">
                                    €{plan.price_monthly.toFixed(2)}/Monat {subscription.billing_cycle === 'YEARLY' ? '(jährlich)' : ''}
                                </p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                                Nächste Abrechnung: <br />
                                {new Date(subscription.next_billing_date).toLocaleDateString('de-DE')}
                            </div>
                        </div>

                        {/* Usage Bars */}
                        <div className="space-y-4 pt-4 border-t">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Gebäude</span>
                                    <span>{buildings.length}/{plan.max_buildings === -1 ? '∞' : plan.max_buildings}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition ${
                                            buildingUsage > 80 ? 'bg-red-500' : buildingUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(buildingUsage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Einheiten</span>
                                    <span>{units.length}/{plan.max_units === -1 ? '∞' : plan.max_units}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition ${
                                            unitUsage > 80 ? 'bg-red-500' : unitUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(unitUsage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Warning if near limit */}
                        {(buildingUsage > 80 || unitUsage > 80) && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                <div className="text-sm text-yellow-800">
                                    Du näherst dich deinem Limit. <Button variant="link" className="p-0 h-auto">Jetzt upgraden</Button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button variant="outline">Plan ändern</Button>
                            <Button variant="outline" className="text-red-600 hover:bg-red-50">
                                Kündigen
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Add-ons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add-ons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">Erweitere deinen Plan mit zusätzlichen Funktionen.</p>
                        <Button>+ Add-on hinzufügen</Button>
                    </CardContent>
                </Card>

                {/* Invoices */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rechnungshistorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span>15.01.2026</span>
                                <span>€{plan.price_monthly.toFixed(2)}</span>
                                <span className="text-green-600">✓ Bezahlt</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}