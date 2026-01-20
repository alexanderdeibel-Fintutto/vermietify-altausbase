import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Euro, User, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ContractDetail() {
    const params = new URLSearchParams(window.location.search);
    const contractId = params.get('id');

    const { data: contract, isLoading } = useQuery({
        queryKey: ['contract', contractId],
        queryFn: async () => {
            const contracts = await base44.entities.LeaseContract.filter({ id: contractId });
            return contracts[0];
        },
        enabled: !!contractId
    });

    const { data: tenant } = useQuery({
        queryKey: ['tenant', contract?.tenant_id],
        queryFn: async () => {
            const tenants = await base44.entities.Tenant.filter({ id: contract.tenant_id });
            return tenants[0];
        },
        enabled: !!contract?.tenant_id
    });

    const { data: unit } = useQuery({
        queryKey: ['unit', contract?.unit_id],
        queryFn: async () => {
            const units = await base44.entities.Unit.filter({ id: contract.unit_id });
            return units[0];
        },
        enabled: !!contract?.unit_id
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    if (!contract) {
        return <div className="text-center py-20">Vertrag nicht gefunden</div>;
    }

    const warmmiete = (parseFloat(contract.kaltmiete) || 0) + (parseFloat(contract.betriebskosten_vorauszahlung) || 0);

    return (
        <div className="space-y-6">
            <Link to={createPageUrl('Contracts')} className="vf-page-back">
                <ArrowLeft className="w-4 h-4" />
                Zurück zu Verträge
            </Link>

            {/* Header */}
            <div className="vf-detail-header">
                <div className="vf-detail-header__top">
                    <div className="flex items-center gap-4">
                        <div className="vf-detail-header__icon">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div className="vf-detail-header__info">
                            <h1 className="vf-detail-header__title">Mietvertrag #{contract.id?.slice(0, 8)}</h1>
                            <p className="vf-detail-header__subtitle">
                                ab {new Date(contract.mietbeginn).toLocaleDateString('de-DE')}
                            </p>
                        </div>
                    </div>
                    <div className="vf-detail-header__actions">
                        <Button variant="outline">Bearbeiten</Button>
                        <Button className="vf-btn-gradient">PDF generieren</Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mietdetails</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Kaltmiete</div>
                                    <div className="text-2xl font-bold text-blue-900">{contract.kaltmiete}€</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Betriebskosten</div>
                                    <div className="text-2xl font-bold text-gray-700">{contract.betriebskosten_vorauszahlung || 0}€</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Warmmiete</div>
                                    <div className="text-2xl font-bold text-green-700">{warmmiete.toFixed(2)}€</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Kaution</div>
                                    <div className="text-2xl font-bold text-gray-700">{contract.kaution || 0}€</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vertragslaufzeit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">Mietbeginn</div>
                                        <div className="font-medium">{new Date(contract.mietbeginn).toLocaleDateString('de-DE')}</div>
                                    </div>
                                </div>
                                {contract.mietende && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <div className="text-sm text-gray-500">Mietende</div>
                                            <div className="font-medium">{new Date(contract.mietende).toLocaleDateString('de-DE')}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mieter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tenant ? (
                                <Link to={createPageUrl('TenantDetail') + `?id=${tenant.id}`}>
                                    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="font-semibold mb-2">{tenant.vorname} {tenant.nachname}</div>
                                        {tenant.email && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="w-3 h-3" />
                                                {tenant.email}
                                            </div>
                                        )}
                                        {tenant.telefon && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Phone className="w-3 h-3" />
                                                {tenant.telefon}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ) : (
                                <div className="text-gray-500">Keine Daten</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Wohneinheit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {unit ? (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="font-semibold mb-2">{unit.nummer}</div>
                                    {unit.flaeche && (
                                        <div className="text-sm text-gray-600">{unit.flaeche} m²</div>
                                    )}
                                    {unit.zimmer && (
                                        <div className="text-sm text-gray-600">{unit.zimmer} Zimmer</div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-500">Keine Daten</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}