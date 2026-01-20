import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, FileText, Euro, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantDetail() {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('id');

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant', tenantId],
        queryFn: async () => {
            const tenants = await base44.entities.Tenant.filter({ id: tenantId });
            return tenants[0];
        },
        enabled: !!tenantId
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts', tenantId],
        queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }),
        enabled: !!tenantId
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    if (!tenant) {
        return <div className="text-center py-20">Mieter nicht gefunden</div>;
    }

    return (
        <div className="space-y-6">
            <Link to={createPageUrl('Tenants')} className="vf-page-back">
                <ArrowLeft className="w-4 h-4" />
                Zurück zu Mieter
            </Link>

            {/* Header */}
            <div className="vf-detail-header">
                <div className="vf-detail-header__top">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {tenant.vorname?.charAt(0)}{tenant.nachname?.charAt(0)}
                        </div>
                        <div className="vf-detail-header__info">
                            <h1 className="vf-detail-header__title">{tenant.vorname} {tenant.nachname}</h1>
                            <p className="vf-detail-header__subtitle">Mieter seit {new Date(tenant.created_date).toLocaleDateString('de-DE')}</p>
                        </div>
                    </div>
                    <div className="vf-detail-header__actions">
                        <Button variant="outline">Bearbeiten</Button>
                        <Button variant="outline">
                            <Mail className="w-4 h-4" />
                            Nachricht senden
                        </Button>
                    </div>
                </div>

                <div className="vf-detail-header__stats">
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">{contracts.length}</div>
                        <div className="vf-detail-stat__label">Verträge</div>
                    </div>
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">-</div>
                        <div className="vf-detail-stat__label">Zahlungen</div>
                    </div>
                    <div className="vf-detail-stat">
                        <div className="vf-detail-stat__value">-</div>
                        <div className="vf-detail-stat__label">Dokumente</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Kontaktinformationen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-500" />
                                <div>
                                    <div className="text-sm text-gray-500">E-Mail</div>
                                    <div className="font-medium">{tenant.email || '-'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-500" />
                                <div>
                                    <div className="text-sm text-gray-500">Telefon</div>
                                    <div className="font-medium">{tenant.telefon || '-'}</div>
                                </div>
                            </div>
                            {tenant.geburtsdatum && (
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">Geburtsdatum</div>
                                        <div className="font-medium">{new Date(tenant.geburtsdatum).toLocaleDateString('de-DE')}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Verträge</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {contracts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Keine Verträge</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contracts.map((contract) => (
                                    <Link key={contract.id} to={createPageUrl('ContractDetail') + `?id=${contract.id}`}>
                                        <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="font-medium mb-1">Vertrag #{contract.id?.slice(0, 8)}</div>
                                            <div className="text-sm text-gray-600">
                                                ab {new Date(contract.mietbeginn).toLocaleDateString('de-DE')}
                                            </div>
                                            {contract.kaltmiete && (
                                                <div className="text-sm font-semibold text-blue-900 mt-1">
                                                    {contract.kaltmiete}€ / Monat
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}