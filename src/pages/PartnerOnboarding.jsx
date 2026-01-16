import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerOnboarding() {
    const [loading, setLoading] = useState(false);
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [newPartner, setNewPartner] = useState({
        partner_type: 'HANDWERKER',
        email: '',
        business_name: '',
        business_type: 'INDIVIDUAL',
    });

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me(),
    });

    const { data: accounts, refetch } = useQuery({
        queryKey: ['connectedAccounts', user?.email],
        queryFn: async () => {
            const data = await base44.entities.StripeConnectedAccount.filter({ created_by: user?.email });
            return data;
        },
        enabled: !!user,
    });

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!newPartner.email || !newPartner.business_name) {
            toast.error('Bitte alle Felder ausfüllen');
            return;
        }

        setCreatingAccount(true);
        try {
            const response = await base44.functions.invoke('createConnectedAccount', {
                partner_id: `PARTNER_${Date.now()}`,
                partner_type: newPartner.partner_type,
                email: newPartner.email,
                business_name: newPartner.business_name,
                business_type: newPartner.business_type.toLowerCase(),
            });

            if (response.data.onboarding_url) {
                window.location.href = response.data.onboarding_url;
            }
        } catch (error) {
            toast.error('Fehler: ' + error.message);
        } finally {
            setCreatingAccount(false);
        }
    };

    const handleRefreshLink = async (accountId) => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('refreshOnboardingLink', {
                connected_account_id: accountId,
            });

            if (response.data.onboarding_url) {
                window.location.href = response.data.onboarding_url;
            }
        } catch (error) {
            toast.error('Fehler: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDashboard = async (accountId) => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('getDashboardLink', {
                connected_account_id: accountId,
            });

            if (response.data.dashboard_url) {
                window.open(response.data.dashboard_url, '_blank');
            }
        } catch (error) {
            toast.error('Fehler: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'ACTIVE') return 'bg-green-100 text-green-800 border-green-300';
        if (status === 'ONBOARDING') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        if (status === 'RESTRICTED') return 'bg-red-100 text-red-800 border-red-300';
        return 'bg-slate-100 text-slate-800 border-slate-300';
    };

    const getStatusIcon = (status) => {
        if (status === 'ACTIVE') return <CheckCircle className="w-5 h-5 text-green-600" />;
        if (status === 'ONBOARDING') return <Clock className="w-5 h-5 text-yellow-600" />;
        if (status === 'RESTRICTED') return <AlertCircle className="w-5 h-5 text-red-600" />;
        return <Clock className="w-5 h-5 text-slate-600" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Partner-Onboarding</h1>
                    <p className="text-slate-600">Zahlungsempfang über Stripe Connect einrichten</p>
                </div>

                {/* Neues Konto erstellen */}
                <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                        <CardTitle>Neues Partner-Konto erstellen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Partner-Typ</label>
                                    <select
                                        value={newPartner.partner_type}
                                        onChange={(e) => setNewPartner({...newPartner, partner_type: e.target.value})}
                                        className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
                                    >
                                        <option value="HANDWERKER">Handwerker</option>
                                        <option value="STEUERBERATER">Steuerberater</option>
                                        <option value="MAKLER">Makler</option>
                                        <option value="VERSICHERUNG">Versicherung</option>
                                        <option value="SONSTIGE">Sonstige</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">Geschäftstyp</label>
                                    <select
                                        value={newPartner.business_type}
                                        onChange={(e) => setNewPartner({...newPartner, business_type: e.target.value})}
                                        className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
                                    >
                                        <option value="INDIVIDUAL">Einzelperson</option>
                                        <option value="COMPANY">Firma</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">E-Mail</label>
                                    <input
                                        type="email"
                                        value={newPartner.email}
                                        onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                                        className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">Name/Firmenname</label>
                                    <input
                                        type="text"
                                        value={newPartner.business_name}
                                        onChange={(e) => setNewPartner({...newPartner, business_name: e.target.value})}
                                        className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Benötigte Dokumente:</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>✓ Personalausweis oder Reisepass</li>
                                    <li>✓ Bankverbindung (IBAN)</li>
                                    <li>✓ Steuernummer</li>
                                    {newPartner.business_type === 'COMPANY' && (
                                        <li>✓ Handelsregister-Nummer & USt-ID</li>
                                    )}
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                disabled={creatingAccount}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {creatingAccount ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Erstelle Account...
                                    </>
                                ) : (
                                    'Zu Stripe Onboarding weiterleiten'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Bestehende Accounts */}
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Meine Partner-Konten</h2>

                {!accounts || accounts.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center py-12 text-slate-600">
                            Noch keine Partner-Konten vorhanden
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <Card key={account.id} className="bg-white shadow-md">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(account.account_status)}
                                            <div>
                                                <h3 className="font-bold text-slate-900">{account.business_name}</h3>
                                                <p className="text-sm text-slate-600">{account.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(account.account_status)}`}>
                                            {account.account_status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-lg p-3 border">
                                            <p className="text-xs text-slate-600">Typ</p>
                                            <p className="font-medium text-slate-900 text-sm">{account.partner_type}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border">
                                            <p className="text-xs text-slate-600">Zahlungen</p>
                                            <p className="font-medium text-sm">
                                                {account.charges_enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border">
                                            <p className="text-xs text-slate-600">Auszahlungen</p>
                                            <p className="font-medium text-sm">
                                                {account.payouts_enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border">
                                            <p className="text-xs text-slate-600">Gesamtumsatz</p>
                                            <p className="font-medium text-slate-900 text-sm">
                                                €{((account.total_volume || 0) / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>

                                    {account.requirements_due && account.requirements_due.length > 0 && (
                                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                                            <p className="text-sm font-medium text-yellow-900 mb-2">⚠️ Fehlende Informationen:</p>
                                            <ul className="text-xs text-yellow-800 space-y-1">
                                                {account.requirements_due.map((req, idx) => (
                                                    <li key={idx}>• {req}</li>
                                                ))}
                                            </ul>
                                            {account.requirements_deadline && (
                                                <p className="text-xs text-yellow-800 mt-2">
                                                    Frist: {new Date(account.requirements_deadline).toLocaleDateString('de-DE')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {!account.onboarding_completed && (
                                            <Button
                                                onClick={() => handleRefreshLink(account.id)}
                                                disabled={loading}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                )}
                                                Bei Stripe fortfahren
                                            </Button>
                                        )}

                                        {account.charges_enabled && (
                                            <Button
                                                onClick={() => handleDashboard(account.id)}
                                                disabled={loading}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Dashboard öffnen
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}