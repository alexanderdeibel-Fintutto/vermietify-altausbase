import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, Calendar, TrendingUp } from 'lucide-react';

export default function UnitLeaseHistory({ unitId }) {
    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['unit-contracts', unitId],
        queryFn: async () => {
            const allContracts = await base44.entities.LeaseContract.filter({ unit_id: unitId });
            return allContracts.sort((a, b) => 
                new Date(b.start_date) - new Date(a.start_date)
            );
        }
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);

    const statusConfig = {
        active: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' },
        terminated: { label: 'Gekündigt', color: 'bg-amber-100 text-amber-700' },
        expired: { label: 'Abgelaufen', color: 'bg-slate-100 text-slate-700' }
    };

    if (isLoading) {
        return <Skeleton className="h-64 rounded-xl" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Miethistorie
                </CardTitle>
            </CardHeader>
            <CardContent>
                {contracts.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Noch keine Mietverträge</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contracts.map((contract, index) => {
                            const tenant = getTenant(contract.tenant_id);
                            const status = statusConfig[contract.status] || statusConfig.active;
                            const isLatest = index === 0;

                            return (
                                <div 
                                    key={contract.id}
                                    className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {tenant && (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium text-slate-800">
                                                        {tenant.first_name} {tenant.last_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isLatest && (
                                                <Badge className="bg-blue-100 text-blue-700">Aktuell</Badge>
                                            )}
                                            <Badge className={status.color}>{status.label}</Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {format(parseISO(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                                                {contract.end_date && !contract.is_unlimited && 
                                                    ` - ${format(parseISO(contract.end_date), 'dd.MM.yyyy', { locale: de })}`}
                                                {contract.is_unlimited && ' - unbefristet'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="font-semibold text-slate-800">
                                                €{contract.total_rent?.toFixed(2)} / Monat
                                            </span>
                                        </div>
                                    </div>

                                    {contract.notes && (
                                        <p className="text-xs text-slate-500 mt-2">{contract.notes}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}