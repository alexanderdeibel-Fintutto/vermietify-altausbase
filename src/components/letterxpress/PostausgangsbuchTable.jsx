import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package, Mail } from 'lucide-react';

export default function PostausgangsbuchTable() {
    const { data: shipments, isLoading } = useQuery({
        queryKey: ['letter-shipments'],
        queryFn: () => base44.entities.LetterShipment.list('-created_date', 100),
        initialData: []
    });

    const getStatusBadge = (status) => {
        const variants = {
            queue: { label: 'Warteschlange', class: 'bg-yellow-100 text-yellow-700' },
            hold: { label: 'Angehalten', class: 'bg-orange-100 text-orange-700' },
            done: { label: 'Verarbeitet', class: 'bg-blue-100 text-blue-700' },
            sent: { label: 'Versendet', class: 'bg-green-100 text-green-700' },
            canceled: { label: 'Storniert', class: 'bg-red-100 text-red-700' }
        };
        const variant = variants[status] || variants.queue;
        return <Badge className={variant.class}>{variant.label}</Badge>;
    };

    const getShippingTypeBadge = (type) => {
        const types = {
            normal: 'Normal',
            r1: 'Einschreiben Einwurf',
            r2: 'Einschreiben'
        };
        return types[type] || type;
    };

    const totalCost = shipments.reduce((sum, s) => sum + (s.cost_gross || 0), 0);

    if (isLoading) {
        return <div className="text-center py-12">Lade Postausgangsbuch...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Postausgangsbuch</CardTitle>
                    <CardDescription>
                        Übersicht aller versendeten Briefe über LetterXpress
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {shipments.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Noch keine Briefe versendet</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-left text-sm text-slate-600">
                                            <th className="pb-3 font-medium">Datum</th>
                                            <th className="pb-3 font-medium">Empfänger</th>
                                            <th className="pb-3 font-medium">Dokument</th>
                                            <th className="pb-3 font-medium">Versandart</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Tracking</th>
                                            <th className="pb-3 font-medium text-right">Kosten</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {shipments.map((shipment) => (
                                            <tr key={shipment.id} className="text-sm">
                                                <td className="py-3">
                                                    {new Date(shipment.sent_at || shipment.created_date).toLocaleDateString('de-DE')}
                                                </td>
                                                <td className="py-3">
                                                    <div className="font-medium text-slate-900">
                                                        {shipment.recipient_name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 max-w-xs truncate">
                                                        {shipment.recipient_address}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="text-slate-900">{shipment.document_type}</div>
                                                    <div className="text-xs text-slate-500">{shipment.filename}</div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-1">
                                                        <Package className="w-3 h-3 text-slate-400" />
                                                        {getShippingTypeBadge(shipment.shipping_type)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {shipment.color === '1' ? 'S/W' : 'Farbe'} • {shipment.pages} Seite(n)
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {getStatusBadge(shipment.status)}
                                                </td>
                                                <td className="py-3">
                                                    {shipment.tracking_code ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(
                                                                `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${shipment.tracking_code}`,
                                                                '_blank'
                                                            )}
                                                        >
                                                            Tracking <ExternalLink className="w-3 h-3 ml-1" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {shipment.cost_gross?.toFixed(2)} €
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 pt-6 border-t flex justify-between items-center">
                                <div className="text-sm text-slate-600">
                                    Gesamt: {shipments.length} Brief(e)
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                    {totalCost.toFixed(2)} € (brutto)
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}