import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Mail, Phone } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import TenantForm from '@/components/tenants/TenantForm';

export default function Tenants() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const queryClient = useQueryClient();

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Tenant.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Tenant.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            setFormOpen(false);
            setEditingTenant(null);
        }
    });

    const handleSubmit = (data) => {
        if (editingTenant) {
            updateMutation.mutate({ id: editingTenant.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleAddNew = () => {
        setEditingTenant(null);
        setFormOpen(true);
    };

    const handleEdit = (tenant) => {
        setEditingTenant(tenant);
        setFormOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Mieter"
                subtitle={`${tenants.length} Mieter verwalten`}
                action={handleAddNew}
                actionLabel="Mieter hinzufügen"
            />

            {tenants.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Noch keine Mieter"
                    description="Fügen Sie Ihren ersten Mieter hinzu."
                    action={handleAddNew}
                    actionLabel="Ersten Mieter anlegen"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => (
                        <Card 
                            key={tenant.id} 
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleEdit(tenant)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-800">
                                            {tenant.first_name} {tenant.last_name}
                                        </h3>
                                        {tenant.occupation && (
                                            <p className="text-sm text-slate-500 mt-1">{tenant.occupation}</p>
                                        )}
                                    </div>
                                    {tenant.jobcenter && (
                                        <Badge className="bg-blue-100 text-blue-700">Jobcenter</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {tenant.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Mail className="w-4 h-4" />
                                        {tenant.email}
                                    </div>
                                )}
                                {tenant.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="w-4 h-4" />
                                        {tenant.phone}
                                    </div>
                                )}
                                {tenant.previous_city && (
                                    <div className="text-xs text-slate-400 mt-3 pt-3 border-t">
                                        Alte Adresse: {tenant.previous_city}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <TenantForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingTenant}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}