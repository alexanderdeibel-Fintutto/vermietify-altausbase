import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Mail, Phone, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CommunicationCenter() {
    const { data: messages = [] } = useQuery({
        queryKey: ['tenantMessages'],
        queryFn: () => base44.entities.TenantMessage.list('-created_date')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const openMessages = messages.filter(m => m.status === 'open');
    const inProgressMessages = messages.filter(m => m.status === 'in_progress');
    const resolvedMessages = messages.filter(m => m.status === 'resolved');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kommunikationszentrale</h1>
                    <p className="vf-page-subtitle">{messages.length} Nachrichten</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Nachricht
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{messages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Nachrichten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Mail className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{openMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Offen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Send className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{inProgressMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">In Bearbeitung</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{resolvedMessages.length}</div>
                        <div className="text-sm opacity-90 mt-1">Gelöst</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 text-orange-700">Offene Anfragen ({openMessages.length})</h3>
                        <div className="space-y-2">
                            {openMessages.slice(0, 5).map((msg) => {
                                const tenant = tenants.find(t => t.id === msg.tenant_id);
                                return (
                                    <div key={msg.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="font-semibold text-sm">{msg.subject}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            von {tenant?.vorname} {tenant?.nachname}
                                        </div>
                                        <Badge className="mt-2 vf-badge-warning text-xs">{msg.category}</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">In Bearbeitung ({inProgressMessages.length})</h3>
                        <div className="space-y-2">
                            {inProgressMessages.slice(0, 5).map((msg) => {
                                const tenant = tenants.find(t => t.id === msg.tenant_id);
                                return (
                                    <div key={msg.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="font-semibold text-sm">{msg.subject}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            von {tenant?.vorname} {tenant?.nachname}
                                        </div>
                                        <Badge className="mt-2 vf-badge-primary text-xs">{msg.category}</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}