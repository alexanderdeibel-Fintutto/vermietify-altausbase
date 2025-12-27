import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, User, Building2, Calendar, Edit, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import ContractForm from '@/components/contracts/ContractForm';
import RentChangeHistory from '@/components/contracts/RentChangeHistory';

export default function ContractDetail() {
    const { contractId } = useParams();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: contract, isLoading } = useQuery({
        queryKey: ['contract', contractId],
        queryFn: async () => {
            const contracts = await base44.entities.LeaseContract.filter({ id: contractId });
            return contracts[0];
        }
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

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.LeaseContract.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract'] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            setFormOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.LeaseContract.delete(id),
        onSuccess: () => {
            window.location.href = createPageUrl('Contracts');
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Vertrag nicht gefunden</h2>
                    <Link to={createPageUrl('Contracts')}>
                        <Button>Zurück zu Verträgen</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const unit = units.find(u => u.id === contract.unit_id);
    const tenant = tenants.find(t => t.id === contract.tenant_id);
    const secondTenant = contract.second_tenant_id ? tenants.find(t => t.id === contract.second_tenant_id) : null;
    const building = unit ? buildings.find(b => b.id === unit.building_id) : null;

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
    const contractStatus = getContractStatus(contract);
    const status = statusConfig[contractStatus] || statusConfig.active;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={createPageUrl('Contracts')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Mietvertrag Details</h1>
                        <p className="text-slate-500">
                            {tenant && `${tenant.first_name} ${tenant.last_name}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setFormOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Bearbeiten
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                    </Button>
                </div>
            </div>

            {/* Contract Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Vertragsinformationen</CardTitle>
                        <Badge className={status.color}>{status.label}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tenant && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-500">Hauptmieter</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-800">
                                    {tenant.first_name} {tenant.last_name}
                                </p>
                                {tenant.email && (
                                    <p className="text-sm text-slate-600">{tenant.email}</p>
                                )}
                                {tenant.phone && (
                                    <p className="text-sm text-slate-600">{tenant.phone}</p>
                                )}
                            </div>
                        )}
                        {secondTenant && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-500">Zweiter Mieter</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-800">
                                    {secondTenant.first_name} {secondTenant.last_name}
                                </p>
                                {secondTenant.email && (
                                    <p className="text-sm text-slate-600">{secondTenant.email}</p>
                                )}
                                {secondTenant.phone && (
                                    <p className="text-sm text-slate-600">{secondTenant.phone}</p>
                                )}
                            </div>
                        )}
                        {building && unit && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-500">Wohnung</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-800">
                                    {building.name}
                                </p>
                                <p className="text-sm text-slate-600">
                                    Wohnung {unit.unit_number} • {unit.sqm}m² • {unit.rooms} Zimmer
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="border-t pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-500">Mietbeginn</span>
                                </div>
                                <p className="text-slate-800">
                                    {contract.start_date && format(parseISO(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                                </p>
                            </div>
                            {contract.handover_date && (
                                <div>
                                    <span className="text-sm font-medium text-slate-500">Wohnungsübergabe</span>
                                    <p className="text-slate-800">
                                        {format(parseISO(contract.handover_date), 'dd.MM.yyyy', { locale: de })}
                                    </p>
                                </div>
                            )}
                            <div>
                                <span className="text-sm font-medium text-slate-500">Mietende</span>
                                <p className="text-slate-800">
                                    {contract.is_unlimited ? 'Unbefristet' : 
                                     contract.end_date ? format(parseISO(contract.end_date), 'dd.MM.yyyy', { locale: de }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Deposit */}
                    {contract.deposit && (
                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-slate-500">Kaution</span>
                                    <p className="text-2xl font-bold text-slate-800">€{contract.deposit.toFixed(2)}</p>
                                    {contract.deposit_installments && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {contract.deposit_installments} {contract.deposit_installments === 1 ? 'Zahlung' : 'monatliche Zahlungen'}
                                        </p>
                                    )}
                                </div>
                                {!contract.deposit_paid && (
                                    <Badge className="bg-red-100 text-red-700">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Nicht bezahlt
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notice Period */}
                    {contract.notice_period_months && (
                        <div className="border-t pt-6">
                            <span className="text-sm font-medium text-slate-500">Kündigungsfrist</span>
                            <p className="text-slate-800">{contract.notice_period_months} Monate</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rent Change History */}
            <RentChangeHistory contract={contract} />

            {/* Form & Delete Dialog */}
            <ContractForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={(data) => updateMutation.mutate({ id: contract.id, data })}
                initialData={contract}
                isLoading={updateMutation.isPending}
                units={units}
                tenants={tenants}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                            onClick={() => deleteMutation.mutate(contract.id)}
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