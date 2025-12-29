import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Search, Pencil, Phone, Mail, Briefcase } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TenantForm from '@/components/tenants/TenantForm';

export default function TenantsList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTenant, setEditingTenant] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Tenant.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            setFormOpen(false);
            setEditingTenant(null);
        }
    });

    // Determine active status for each tenant
    const tenantsWithStatus = useMemo(() => {
        return tenants.map(tenant => {
            const tenantContracts = contracts.filter(c => 
                c.tenant_id === tenant.id || c.second_tenant_id === tenant.id
            );
            const hasActiveContract = tenantContracts.some(c => c.status === 'active');
            return {
                ...tenant,
                isActive: hasActiveContract
            };
        });
    }, [tenants, contracts]);

    // Filter and sort tenants
    const filteredTenants = useMemo(() => {
        let filtered = tenantsWithStatus;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(tenant => 
                `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(term) ||
                tenant.email?.toLowerCase().includes(term) ||
                tenant.phone?.toLowerCase().includes(term)
            );
        }

        // Sort: active first, then alphabetically by name
        return filtered.sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [tenantsWithStatus, searchTerm]);

    const handleSubmit = (data) => {
        if (editingTenant) {
            updateMutation.mutate({ id: editingTenant.id, data });
        }
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                    placeholder="Mieter suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tenants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenants.map(tenant => (
                    <Card key={tenant.id} className="border-slate-200/50 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">
                                            {tenant.first_name} {tenant.last_name}
                                        </h3>
                                        <Badge className={tenant.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                                            {tenant.isActive ? 'Aktiv' : 'Inaktiv'}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setEditingTenant(tenant);
                                        setFormOpen(true);
                                    }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2 text-sm">
                                {tenant.email && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="truncate">{tenant.email}</span>
                                    </div>
                                )}
                                {tenant.phone && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span>{tenant.phone}</span>
                                    </div>
                                )}
                                {tenant.occupation && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        <span>{tenant.occupation}</span>
                                    </div>
                                )}
                                {tenant.jobcenter && (
                                    <Badge variant="outline" className="text-xs">
                                        Jobcenter
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredTenants.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    Keine Mieter gefunden
                </div>
            )}

            <TenantForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingTenant}
                isLoading={updateMutation.isPending}
            />
        </div>
    );
}