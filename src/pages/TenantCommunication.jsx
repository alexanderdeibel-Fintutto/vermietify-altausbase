import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Send, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function TenantCommunication() {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('tenant_id');

    const [message, setMessage] = useState('');
    const queryClient = useQueryClient();

    const { data: messages = [] } = useQuery({
        queryKey: ['tenantMessages', tenantId],
        queryFn: () => base44.entities.TenantMessage.filter({ tenant_id: tenantId }),
        enabled: !!tenantId
    });

    const { data: tenant } = useQuery({
        queryKey: ['tenant', tenantId],
        queryFn: async () => {
            const tenants = await base44.entities.Tenant.filter({ id: tenantId });
            return tenants[0];
        },
        enabled: !!tenantId
    });

    const sendMessageMutation = useMutation({
        mutationFn: (data) => base44.entities.TenantMessage.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantMessages', tenantId] });
            setMessage('');
            showSuccess('Nachricht gesendet');
        }
    });

    const handleSend = () => {
        if (!message.trim()) return;
        sendMessageMutation.mutate({
            tenant_id: tenantId,
            subject: 'Neue Nachricht',
            category: 'general',
            message: message,
            status: 'open'
        });
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Chat mit {tenant?.vorname} {tenant?.nachname}</h1>
                    <p className="vf-page-subtitle">Nachrichten & Anfragen</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                <p>Noch keine Nachrichten</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-semibold">{msg.subject}</div>
                                        <Badge className={
                                            msg.status === 'resolved' ? 'vf-badge-success' :
                                            msg.status === 'in_progress' ? 'vf-badge-info' :
                                            'vf-badge-warning'
                                        }>
                                            {msg.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{msg.message}</p>
                                    {msg.response && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                                            <div className="text-xs text-blue-600 font-semibold mb-1">Antwort:</div>
                                            <p className="text-sm text-gray-700">{msg.response}</p>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-2">
                                        {new Date(msg.created_date).toLocaleDateString('de-DE')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <VfTextarea
                            placeholder="Nachricht eingeben..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                        <div className="flex justify-end mt-3">
                            <Button onClick={handleSend} className="vf-btn-gradient">
                                <Send className="w-4 h-4" />
                                Senden
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}