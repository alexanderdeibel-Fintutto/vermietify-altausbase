import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Plus, Send, Mail, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function CommunicationCenter() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        tenant_id: '',
        subject: '',
        category: 'general',
        message: ''
    });

    const queryClient = useQueryClient();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['tenantMessages'],
        queryFn: () => base44.entities.TenantMessage.list('-created_date')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const createMessageMutation = useMutation({
        mutationFn: (data) => base44.entities.TenantMessage.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantMessages'] });
            setDialogOpen(false);
            setFormData({ tenant_id: '', subject: '', category: 'general', message: '' });
            showSuccess('Nachricht gesendet');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMessageMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kommunikation</h1>
                    <p className="vf-page-subtitle">{messages.length} Nachrichten</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Neue Nachricht
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Nachricht an Mieter</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Empfänger"
                                    value={formData.tenant_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, tenant_id: value }))}
                                    options={tenants.map(t => ({ value: t.id, label: `${t.vorname} ${t.nachname}` }))}
                                    required
                                />
                                <VfInput
                                    label="Betreff"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    required
                                />
                                <VfSelect
                                    label="Kategorie"
                                    value={formData.category}
                                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                                    options={[
                                        { value: 'general', label: 'Allgemein' },
                                        { value: 'repair', label: 'Reparatur' },
                                        { value: 'billing', label: 'Abrechnung' },
                                        { value: 'other', label: 'Sonstiges' }
                                    ]}
                                />
                                <VfTextarea
                                    label="Nachricht"
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    rows={6}
                                    required
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        <Send className="w-4 h-4" />
                                        Senden
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {messages.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <MessageSquare className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Keine Nachrichten</h3>
                            <p className="text-gray-600 mb-6">Starten Sie die Kommunikation mit Ihren Mietern</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erste Nachricht senden
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {messages.map((message) => {
                        const tenant = tenants.find(t => t.id === message.tenant_id);
                        return (
                            <Card key={message.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <MessageSquare className="w-8 h-8 text-blue-600 mt-1" />
                                            <div>
                                                <h3 className="font-semibold mb-1">{message.subject}</h3>
                                                <div className="text-sm text-gray-600 mb-2">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </div>
                                                <p className="text-sm text-gray-700">{message.message}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge className={
                                                        message.status === 'resolved' ? 'vf-badge-success' :
                                                        message.status === 'in_progress' ? 'vf-badge-info' :
                                                        'vf-badge-warning'
                                                    }>
                                                        {message.status}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(message.created_date).toLocaleDateString('de-DE')}
                                                    </span>
                                                </div>
                                            </div>
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