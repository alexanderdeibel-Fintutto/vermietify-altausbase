import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { regenerateContractFinancialItems } from '@/components/contracts/generateFinancialItems';
import AddFinancialItemDialog from '@/components/contracts/AddFinancialItemDialog';

export default function Contracts() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [deleteContract, setDeleteContract] = useState(null);
    const [addFinancialItemOpen, setAddFinancialItemOpen] = useState(false);
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

    const { data: rentChanges = [] } = useQuery({
        queryKey: ['rent-changes'],
        queryFn: () => base44.entities.RentChange.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const contract = await base44.entities.LeaseContract.create(data);
            return contract;
        },
        onSuccess: async (result) => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            setFormOpen(false);
            if (result && !result.needsPartialRentConfirmation) {
                await regenerateContractFinancialItems(result.id);
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.LeaseContract.update(id, data),
        onSuccess: async (_, variables) => {
            // FIRST: Regenerate financial items based on new contract data
            await regenerateContractFinancialItems(variables.id);
            // THEN: Invalidate queries to refresh UI with new data
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
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

    const getCurrentRent = (contract) => {
        if (!contract) return null;
        
        // Get all rent changes for this contract that are effective (effective_date <= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const applicableChanges = rentChanges
            .filter(rc => rc.contract_id === contract.id)
            .filter(rc => {
                try {
                    const effectiveDate = parseISO(rc.effective_date);
                    return !isNaN(effectiveDate.getTime()) && effectiveDate <= today;
                } catch {
                    return false;
                }
            })
            .sort((a, b) => {
                // Sort by effective_date descending (most recent first)
                try {
                    const dateA = parseISO(a.effective_date);
                    const dateB = parseISO(b.effective_date);
                    return dateB.getTime() - dateA.getTime();
                } catch {
                    return 0;
                }
            });
        
        // If there's an applicable rent change, return it, otherwise return the contract's original rent
        if (applicableChanges.length > 0) {
            const latestChange = applicableChanges[0];
            return {
                base_rent: latestChange.base_rent,
                utilities: latestChange.utilities,
                heating: latestChange.heating,
                total_rent: latestChange.total_rent
            };
        }
        
        return {
            base_rent: contract.base_rent,
            utilities: contract.utilities,
            heating: contract.heating,
            total_rent: contract.total_rent
        };
    };

    const getContractStatus = (contract) => {
        if (!contract.start_date) return 'active';
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = parseISO(contract.start_date);
            
            if (isNaN(startDate.getTime())) return 'active';
            
            const endDate = contract.end_date ? parseISO(contract.end_date) : null;

            if (startDate > today) {
                return 'pending';
            } else if (endDate && !isNaN(endDate.getTime()) && endDate < today) {
                return 'expired';
            } else if (contract.termination_date) {
                return 'terminated';
            } else {
                return 'active';
            }
        } catch {
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
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
            <PageHeader 
                title="Mietverträge"
                subtitle={`${contracts.length} Verträge · ${tenants.length} Mieter`}
            />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
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
                    <div className="flex justify-end mb-4">
                        <Button 
                            onClick={() => {
                                setEditingContract(null);
                                setFormOpen(true);
                            }}
                            className="bg-slate-700 hover:bg-slate-800 font-extralight"
                        >
                            Vertrag hinzufügen
                        </Button>
                    </div>
                    <AnimatePresence mode="wait">
                    {contracts.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                        <EmptyState
                            icon={FileText}
                            title="Noch keine Mietverträge"
                            description="Erstellen Sie Ihren ersten Mietvertrag."
                            action={() => setFormOpen(true)}
                            actionLabel="Ersten Vertrag anlegen"
                        />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {contracts.map((contract, idx) => {
                                const contractId = contract.id;
                                const unit = getUnit(contract.unit_id);
                                const tenant = getTenant(contract.tenant_id);
                                const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
                                const building = unit ? getBuilding(unit.building_id) : null;
                                const contractStatus = getContractStatus(contract);
                                const status = statusConfig[contractStatus] || statusConfig.active;
                                const currentRent = getCurrentRent(contract);

                                return (
                                    <motion.div
                                        key={contractId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                    <Link 
                                        key={contractId}
                                        to={createPageUrl(`ContractDetail?contractId=${contractId}`)}
                                        className="block"
                                    >
                                        <Card className="border-slate-200/50 hover:shadow-md transition-shadow cursor-pointer">
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
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8"
                                                            onClick={(e) => e.preventDefault()}
                                                        >
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
                                                            €{currentRent?.total_rent?.toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Kalt: €{currentRent?.base_rent?.toFixed(2)} + NK: €{(currentRent?.utilities || 0).toFixed(2)} + HK: €{(currentRent?.heating || 0).toFixed(2)}
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
                                </Link>
                                </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                    </AnimatePresence>
                </TabsContent>

                <TabsContent value="tenants">
                    <TenantsList />
                </TabsContent>

                <TabsContent value="financials">
                    <div className="flex justify-end mb-4">
                        <Button 
                            onClick={() => setAddFinancialItemOpen(true)}
                            className="bg-slate-700 hover:bg-slate-800 font-extralight"
                        >
                            Mietforderung hinzufügen
                        </Button>
                    </div>
                    <FinancialItemsList />
                </TabsContent>
            </Tabs>
            </motion.div>

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

            <AddFinancialItemDialog
                open={addFinancialItemOpen}
                onOpenChange={setAddFinancialItemOpen}
                contracts={contracts}
                units={units}
                buildings={buildings}
                tenants={tenants}
            />
        </div>
    );
}