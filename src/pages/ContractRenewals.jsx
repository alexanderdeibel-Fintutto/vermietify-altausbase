import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ContractRenewals() {
    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    // Filter contracts expiring in next 6 months
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    const expiringContracts = contracts.filter(c => {
        if (!c.mietende) return false;
        const endDate = new Date(c.mietende);
        return endDate >= today && endDate <= sixMonthsFromNow;
    }).sort((a, b) => new Date(a.mietende) - new Date(b.mietende));

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Vertragsverlängerungen</h1>
                    <p className="vf-page-subtitle">{expiringContracts.length} Verträge laufen demnächst aus</p>
                </div>
            </div>

            {expiringContracts.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Keine auslaufenden Verträge</h3>
                            <p className="text-gray-600">In den nächsten 6 Monaten laufen keine Verträge aus</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {expiringContracts.map((contract) => {
                        const tenant = tenants.find(t => t.id === contract.tenant_id);
                        const daysUntilExpiry = Math.ceil((new Date(contract.mietende) - today) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysUntilExpiry <= 60;

                        return (
                            <Card key={contract.id} className={isUrgent ? 'border-orange-300 bg-orange-50/50' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${isUrgent ? 'bg-orange-600' : 'bg-blue-600'}`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">
                                                        {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                    </h3>
                                                    {isUrgent && <AlertCircle className="w-4 h-4 text-orange-600" />}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-3 h-3" />
                                                    Läuft aus am: {new Date(contract.mietende).toLocaleDateString('de-DE')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Noch {daysUntilExpiry} Tage
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg">{contract.kaltmiete}€</div>
                                            <Badge className={isUrgent ? 'vf-badge-warning' : 'vf-badge-info'}>
                                                {isUrgent ? 'Dringend' : 'Geplant'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}