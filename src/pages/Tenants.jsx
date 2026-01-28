import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Mail, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { showSuccess } from '@/components/notifications/ToastNotification';
import TenantPortalAccessButton from '@/components/tenant-portal/TenantPortalAccessButton';

export default function Tenants() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        vorname: '',
        nachname: '',
        email: '',
        telefon: ''
    });

    const queryClient = useQueryClient();

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list('-created_date')
    });

    const createTenantMutation = useMutation({
        mutationFn: (data) => base44.entities.Tenant.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            setDialogOpen(false);
            setFormData({ vorname: '', nachname: '', email: '', telefon: '' });
            showSuccess('Mieter erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createTenantMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieter</h1>
                    <p className="vf-page-subtitle">{tenants.length} Mieter verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Mieter hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neuer Mieter</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Vorname"
                                    value={formData.vorname}
                                    onChange={(e) => setFormData(prev => ({ ...prev, vorname: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Nachname"
                                    value={formData.nachname}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nachname: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="E-Mail"
                                    type="email"
                                    leftIcon={Mail}
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Telefon"
                                    type="tel"
                                    leftIcon={Phone}
                                    value={formData.telefon}
                                    onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Erstellen
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {tenants.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Users className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Mieter</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihren ersten Mieter hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Ersten Mieter hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => (
                        <Link key={tenant.id} to={createPageUrl('TenantDetail') + `?id=${tenant.id}`}>
                            <Card className="vf-card-clickable h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                                            {tenant.vorname?.charAt(0)}{tenant.nachname?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg mb-2">
                                                {tenant.vorname} {tenant.nachname}
                                            </h3>
                                            {tenant.email && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{tenant.email}</span>
                                                </div>
                                            )}
                                            {tenant.telefon && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Phone className="w-3 h-3" />
                                                    {tenant.telefon}
                                                </div>
                                            )}
                                            <div className="mt-3 pt-3 border-t">
                                                <TenantPortalAccessButton 
                                                    tenant={tenant}
                                                    unitId={null}
                                                    buildingId={null}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}