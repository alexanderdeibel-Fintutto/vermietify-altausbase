import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, AlertCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LeaseManagement() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list('-mietbeginn')
    });

    const activeContracts = contracts.filter(c => new Date(c.mietende) > new Date());
    const expiringSoon = activeContracts.filter(c => {
        const daysUntil = (new Date(c.mietende) - new Date()) / (24*60*60*1000);
        return daysUntil <= 90;
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietverträge</h1>
                    <p className="vf-page-subtitle">{contracts.length} Verträge verwaltet</p>
                </div>
                <Button className="vf-btn-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Mietvertrag
                </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{activeContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktiv</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-orange-700">{expiringSoon.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Laufen bald aus</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {contracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0).toLocaleString('de-DE')}€
                        </div>
                        <div className="text-sm opacity-90 mt-1">Monatliche Miete</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Vertragsliste</h3>
                    <div className="space-y-2">
                        {contracts.map(c => (
                            <div key={c.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{c.einheit}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {new Date(c.mietbeginn).toLocaleDateString('de-DE')} - {new Date(c.mietende).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{c.kaltmiete.toLocaleString('de-DE')}€</div>
                                        <Badge className={new Date(c.mietende) > new Date() ? 'vf-badge-success' : 'vf-badge-default'}>
                                            {new Date(c.mietende) > new Date() ? 'Aktiv' : 'Beendet'}
                                        </Badge>
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