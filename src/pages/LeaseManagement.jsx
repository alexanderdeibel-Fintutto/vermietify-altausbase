import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LeaseManagement() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list('-vertragsbeginn')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const filteredContracts = contracts.filter(c => {
        const tenant = tenants.find(t => t.id === c.tenant_id);
        const tenantName = tenant ? `${tenant.vorname} ${tenant.nachname}`.toLowerCase() : '';
        return tenantName.includes(searchTerm.toLowerCase());
    });

    const activeContracts = contracts.filter(c => !c.vertragsende || new Date(c.vertragsende) > new Date());
    const expiringContracts = activeContracts.filter(c => {
        if (!c.vertragsende) return false;
        const diff = new Date(c.vertragsende) - new Date();
        return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietverträge</h1>
                    <p className="vf-page-subtitle">{contracts.length} Verträge</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{activeContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Verträge</div>
                    </CardContent>
                </Card>

                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-orange-700">{expiringContracts.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Laufen aus (90 Tage)</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{contracts.length - activeContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Beendet</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Verträge durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            <div className="space-y-3">
                {filteredContracts.map((contract) => {
                    const tenant = tenants.find(t => t.id === contract.tenant_id);
                    const unit = units.find(u => u.id === contract.unit_id);
                    const isActive = !contract.vertragsende || new Date(contract.vertragsende) > new Date();

                    return (
                        <Link key={contract.id} to={createPageUrl('ContractDetail') + `?id=${contract.id}`}>
                            <Card className="vf-card-clickable">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <FileText className="w-8 h-8 text-purple-600" />
                                            <div>
                                                <h3 className="font-semibold mb-1">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </h3>
                                                <div className="text-sm text-gray-600 mb-2">
                                                    {unit?.nummer || 'Keine Einheit'}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>Start: {new Date(contract.vertragsbeginn).toLocaleDateString('de-DE')}</span>
                                                    {contract.vertragsende && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Ende: {new Date(contract.vertragsende).toLocaleDateString('de-DE')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{contract.kaltmiete}€</div>
                                            <Badge className={isActive ? 'vf-badge-success' : 'vf-badge-default'}>
                                                {isActive ? 'Aktiv' : 'Beendet'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}