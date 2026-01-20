import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Euro, Building2, ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InvoiceDetail() {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('id');

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            const invoices = await base44.entities.Invoice.filter({ id: invoiceId });
            return invoices[0];
        },
        enabled: !!invoiceId
    });

    const { data: building } = useQuery({
        queryKey: ['building', invoice?.building_id],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: invoice.building_id });
            return buildings[0];
        },
        enabled: !!invoice?.building_id
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    if (!invoice) {
        return <div className="text-center py-20">Rechnung nicht gefunden</div>;
    }

    return (
        <div className="space-y-6">
            <Link to={createPageUrl('Invoices')} className="vf-page-back">
                <ArrowLeft className="w-4 h-4" />
                Zurück zu Rechnungen
            </Link>

            <div className="vf-detail-header">
                <div className="vf-detail-header__top">
                    <div className="flex items-center gap-4">
                        <div className="vf-detail-header__icon">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div className="vf-detail-header__info">
                            <h1 className="vf-detail-header__title">{invoice.beschreibung}</h1>
                            <p className="vf-detail-header__subtitle">
                                {new Date(invoice.rechnungsdatum).toLocaleDateString('de-DE')}
                            </p>
                        </div>
                    </div>
                    <div className="vf-detail-header__actions">
                        <Button variant="outline">
                            <Download className="w-4 h-4" />
                            PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Rechnungsdetails</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500">Betrag</div>
                                <div className="text-3xl font-bold text-red-700">{invoice.betrag}€</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Rechnungsdatum</div>
                                <div className="font-medium">{new Date(invoice.rechnungsdatum).toLocaleDateString('de-DE')}</div>
                            </div>
                            {invoice.faelligkeitsdatum && (
                                <div>
                                    <div className="text-sm text-gray-500">Fälligkeitsdatum</div>
                                    <div className="font-medium">{new Date(invoice.faelligkeitsdatum).toLocaleDateString('de-DE')}</div>
                                </div>
                            )}
                            {invoice.lieferant && (
                                <div>
                                    <div className="text-sm text-gray-500">Lieferant</div>
                                    <div className="font-medium">{invoice.lieferant}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Zuordnung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {building ? (
                            <Link to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                                <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold">{building.name}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">{building.ort}</div>
                                </div>
                            </Link>
                        ) : (
                            <div className="text-gray-500">Kein Gebäude zugeordnet</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}