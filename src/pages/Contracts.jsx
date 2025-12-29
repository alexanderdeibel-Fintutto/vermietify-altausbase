import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText, MoreVertical, Pencil, Trash2, User, Users, Building2, Calendar, AlertCircle, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ContractForm from '@/components/contracts/ContractForm';
import TenantsList from '@/components/contracts/TenantsList';
import FinancialItemsList from '@/components/contracts/FinancialItemsList';

export default function Contracts() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [deleteContract, setDeleteContract] = useState(null);
    const queryClient = useQueryClient();

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const contract = await base44.entities.LeaseContract.create(data);
            return contract;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.LeaseContract.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            setFormOpen(false);
            setEditingContract(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            // Zuerst alle zugehörigen Zahlungen löschen
            const payments = await base44.entities.Payment.filter({ contract_id: id });
            for (const payment of payments) {
                await base44.entities.Payment.delete(payment.id);
            }
            // Dann den Vertrag löschen
            await base44.entities.LeaseContract.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setDeleteContract(null);
        }
    });

    const handleSubmit = async (data) => {
        if (editingContract) {
            updateMutation.mutate({ id: editingContract.id, data });
            return null;
        } else {
            return new Promise((resolve, reject) => {
                createMutation.mutate(data, {
                    onSuccess: (result) => resolve(result),
                    onError: (error) => reject(error)
                });
            });
        }
    };

    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    const getContractStatus = (contract) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(contract.start_date);
        const endDate = contract.end_date ? new Date(contract.end_date) : null;

        if (startDate > today) {
            return 'pending';
        } else if (endDate && endDate < today) {
            return 'expired';
        } else if (contract.termination_date) {
            return 'terminated';
        } else {
            return 'active';
        }
    };

    const statusConfig = {
        pending: { label: 'Bevorstehend', color: 'bg-blue-100 text-blue-700' },
        active: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' },
        terminated: { label: 'Gekündigt', color: 'bg-amber-100 text-amber-700' },
        expired: { label: 'Beendet', color: 'bg-slate-100 text-slate-700' }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Mietverträge"
                subtitle={`${contracts.length} Verträge · ${tenants.length} Mieter`}
                action={() => {
                    setEditingContract(null);
                    setFormOpen(true);
                }}
                actionLabel="Vertrag hinzufügen"
            />

            <Tabs defaultValue="contracts" className="space-y-6">
                <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="contracts">
                        Mietverträge ({contracts.length})
                    </TabsTrigger>
                    <TabsTrigger value="tenants">
                        Mieter ({tenants.length})
                    </TabsTrigger>
                    <TabsTrigger value="financials">
                        Mietforderungen
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="contracts" className="space-y-6">
                    {contracts.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="Noch keine Mietverträge"
                            description="Erstellen Sie Ihren ersten Mietvertrag."
                            action={() => setFormOpen(true)}
                            actionLabel="Ersten Vertrag anlegen"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {contracts.map((contract) => {
                                const contractId = contract.id;
                                const unit = getUnit(contract.unit_id);
                                const tenant = getTenant(contract.tenant_id);
                                const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
                                const building = unit ? getBuilding(unit.building_id) : null;
                                const contractStatus = getContractStatus(contract);
                                const status = statusConfig[contractStatus] || statusConfig.active;

                                return (
                                    <Card key={contractId} className="border-slate-200/50 hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={status.color}>
                                                            {status.label}
                                                        </Badge>
                                                        {!contract.deposit_paid && contract.deposit && (
                                                            <Badge className="bg-red-100 text-red-700">
                                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                                Kaution offen
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link to={createPageUrl(`ContractDetail?contractId=${contractId}`)}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Details anzeigen
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setEditingContract(contract);
                                                            setFormOpen(true);
                                                        }}>
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Bearbeiten
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => setDeleteContract(contract)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Löschen
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="space-y-3">
                                                {tenant && (
                                                    <div className="flex items-center gap-2">
                                                        {secondTenant ? <Users className="w-4 h-4 text-slate-400" /> : <User className="w-4 h-4 text-slate-400" />}
                                                        <span className="font-medium text-slate-800">
                                                            {tenant.first_name} {tenant.last_name}
                                                            {secondTenant && ` & ${secondTenant.first_name} ${secondTenant.last_name}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {building && unit && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        {building.name} - {unit.unit_number}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {contract.start_date && (() => {
                                                        try {
                                                            return format(parseISO(contract.start_date), 'dd.MM.yyyy');
                                                        } catch {
                                                            return contract.start_date;
                                                        }
                                                    })()}
                                                    {contract.end_date && !contract.is_unlimited && (() => {
                                                        try {
                                                            return ` - ${format(parseISO(contract.end_date), 'dd.MM.yyyy')}`;
                                                        } catch {
                                                            return ` - ${contract.end_date}`;
                                                        }
                                                    })()}
                                                    {contract.is_unlimited && ' - unbefristet'}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm text-slate-500">Warmmiete</p>
                                                        <p className="text-2xl font-bold text-slate-800">
                                                            €{contract.total_rent?.toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Kalt: €{contract.base_rent?.toFixed(2)} + NK: €{(contract.utilities || 0).toFixed(2)} + HK: €{(contract.heating || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    {contract.deposit && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-slate-500">Kaution</p>
                                                            <p className="text-lg font-semibold text-slate-700">
                                                                €{contract.deposit.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="tenants">
                    <TenantsList />
                </TabsContent>

                <TabsContent value="financials">
                    <FinancialItemsList />
                </TabsContent>
            </Tabs>

            <ContractForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingContract}
                isLoading={createMutation.isPending || updateMutation.isPending}
                units={units}
                tenants={tenants}
            />

            <AlertDialog open={!!deleteContract} onOpenChange={() => setDeleteContract(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mietvertrag löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie diesen Mietvertrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteContract.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}