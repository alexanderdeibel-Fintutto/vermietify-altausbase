import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CommunicationCenter() {
    const { data: messages = [] } = useQuery({
        queryKey: ['tenantMessages'],
        queryFn: () => base44.entities.TenantMessage.list('-created_date')
    });

    const openMessages = messages.filter(m => m.status === 'open');
    const resolvedMessages = messages.filter(m => m.status === 'resolved');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kommunikationszentrale</h1>
                    <p className="vf-page-subtitle">{messages.length} Nachrichten</p>
                </div>
                <Button className="vf-btn-gradient">
                    <Send className="w-4 h-4 mr-2" />
                    Neue Nachricht
                </Button>
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
                        <div className="text-3xl font-bold text-orange-700">{openMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Offen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">{resolvedMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Beantwortet</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {(resolvedMessages.length / messages.length * 100 || 0).toFixed(0)}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">Beantwortet</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Aktuelle Nachrichten</h3>
                    <div className="space-y-2">
                        {messages.slice(0, 10).map(msg => (
                            <div key={msg.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">{msg.subject}</div>
                                        <div className="text-sm text-gray-600 line-clamp-2">{msg.message}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(msg.created_date).toLocaleString('de-DE')}
                                        </div>
                                    </div>
                                    <Badge className={
                                        msg.status === 'open' ? 'vf-badge-warning' :
                                        msg.status === 'resolved' ? 'vf-badge-success' :
                                        'vf-badge-default'
                                    }>
                                        {msg.status === 'open' ? 'Offen' : msg.status === 'resolved' ? 'Beantwortet' : msg.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}