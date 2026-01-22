import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, DollarSign, AlertCircle, FileText, Wrench, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
    const { user: supabaseUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Check authentication
    useEffect(() => {
        if (!authLoading && !supabaseUser) {
            navigate(createPageUrl('Login'));
        }
    }, [authLoading, supabaseUser, navigate]);

    // Check subscription status
    const { data: subscription } = useQuery({
        queryKey: ['user-subscription', supabaseUser?.email],
        queryFn: async () => {
            const subs = await base44.entities.UserSubscription.filter({ user_email: supabaseUser.email });
            return subs[0];
        },
        enabled: !!supabaseUser
    });

    useEffect(() => {
        if (supabaseUser && subscription && subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
            navigate(createPageUrl('Billing'));
        }
    }, [supabaseUser, subscription, navigate]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list()
    });

    const monthlyRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);
    const openTasks = tasks.filter(t => t.status === 'Offen' || t.status === 'open').length;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Übersicht</h1>
                    <p className="vf-page-subtitle">Willkommen zurück</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Immobilien</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{tenants.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{monthlyRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Monatliche Miete</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Ausstehende Aufgaben ({openTasks})
                        </h3>
                        <div className="space-y-2">
                            {tasks.filter(t => t.status === 'Offen' || t.status === 'open').slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Fällig: {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Wrench className="w-5 h-5" />
                            Wartungsaufträge
                        </h3>
                        <div className="space-y-2">
                            {tasks.filter(t => t.kategorie === 'Reparatur').slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <Badge className="mt-2 vf-badge-error text-xs">{task.prioritaet}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Mietverträge</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamtausgaben</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{documents.length}</div>
                        <div className="text-sm opacity-90 mt-1">Dokumente</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Finanz-Übersicht</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm text-gray-600">Monatliche Einnahmen</div>
                            <div className="text-2xl font-bold text-green-700 mt-2">
                                {(monthlyRent).toLocaleString('de-DE')}€
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm text-gray-600">Jahresbudget</div>
                            <div className="text-2xl font-bold text-blue-700 mt-2">
                                {(monthlyRent * 12).toLocaleString('de-DE')}€
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}