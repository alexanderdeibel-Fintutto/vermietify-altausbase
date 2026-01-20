import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, FileText, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantCommunication() {
    const [selectedTenant, setSelectedTenant] = useState(null);

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

    const messagesByCategory = {
        repair: messages.filter(m => m.category === 'repair').length,
        billing: messages.filter(m => m.category === 'billing').length,
        general: messages.filter(m => m.category === 'general').length,
        other: messages.filter(m => m.category === 'other').length
    };

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieter-Kommunikation</h1>
                    <p className="vf-page-subtitle">{messages.length} Anfragen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{openMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Neu</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{inProgressMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">In Bearbeitung</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{resolvedMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gelöst</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{messagesByCategory.repair}</div>
                        <div className="text-sm text-gray-600 mt-1">Reparaturen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{messages.length}</div>
                        <div className="text-sm opacity-90 mt-1">Gesamt</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Neue Anfragen</h3>
                        <div className="space-y-2">
                            {openMessages.slice(0, 5).map((msg) => {
                                const tenant = tenants.find(t => t.id === msg.tenant_id);
                                return (
                                    <button
                                        key={msg.id}
                                        onClick={() => setSelectedTenant(msg)}
                                        className="w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition text-left"
                                    >
                                        <div className="font-semibold text-sm">{tenant?.vorname} {tenant?.nachname}</div>
                                        <div className="text-xs text-gray-600 mt-1 truncate">{msg.subject}</div>
                                        <Badge className="mt-2 vf-badge-default text-xs">{msg.category}</Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">In Bearbeitung</h3>
                        <div className="space-y-2">
                            {inProgressMessages.slice(0, 5).map((msg) => {
                                const tenant = tenants.find(t => t.id === msg.tenant_id);
                                return (
                                    <button
                                        key={msg.id}
                                        onClick={() => setSelectedTenant(msg)}
                                        className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition text-left"
                                    >
                                        <div className="font-semibold text-sm">{tenant?.vorname} {tenant?.nachname}</div>
                                        <div className="text-xs text-gray-600 mt-1 truncate">{msg.subject}</div>
                                        <Badge className="mt-2 vf-badge-warning text-xs">{msg.category}</Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Kategorien</h3>
                        <div className="space-y-3">
                            {Object.entries(messagesByCategory).map(([cat, count]) => (
                                <div key={cat} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-semibold capitalize">{cat}</span>
                                    <Badge>{count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedTenant && (
                <Card className="border-blue-300 bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">Anfrage Details</h3>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedTenant(null)}>✕</Button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-white rounded-lg border">
                                <div className="font-semibold mb-2">{selectedTenant.subject}</div>
                                <p className="text-gray-700 text-sm mb-4">{selectedTenant.message}</p>
                                <div className="flex items-center justify-between">
                                    <Badge>{selectedTenant.category}</Badge>
                                    <Badge className={
                                        selectedTenant.status === 'resolved' ? 'vf-badge-success' :
                                        selectedTenant.status === 'in_progress' ? 'vf-badge-info' :
                                        'vf-badge-warning'
                                    }>
                                        {selectedTenant.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1 vf-btn-primary">
                                    <Send className="w-4 h-4 mr-2" />
                                    Antwort schreiben
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Anrufen
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}