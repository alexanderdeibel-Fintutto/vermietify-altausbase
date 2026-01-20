import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InvoiceManagement() {
    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list('-created_date')
    });

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const totalAmount = invoices.reduce((sum, i) => sum + (parseFloat(i.betrag) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Rechnungsverwaltung</h1>
                    <p className="vf-page-subtitle">{invoices.length} Rechnungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Rechnung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{invoices.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Rechnungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{pendingInvoices.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{paidInvoices.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Bezahlt</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{totalAmount.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Gesamtbetrag</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Rechnungen</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {invoices.slice(0, 15).map((invoice) => (
                            <div key={invoice.id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">{invoice.rechnungsnummer}</div>
                                        <div className="text-xs text-gray-600 mt-1">{invoice.kategorie}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="font-bold">{invoice.betrag.toLocaleString('de-DE')}€</div>
                                            <Badge className={invoice.status === 'paid' ? 'vf-badge-success' : 'vf-badge-warning'}>
                                                {invoice.status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                                            </Badge>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}