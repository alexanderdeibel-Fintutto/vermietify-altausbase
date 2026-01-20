import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NotificationCenter() {
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => base44.entities.Notification.list('-created_date')
    });

    const unreadNotifications = notifications.filter(n => !n.is_read);
    const categorizedNotifications = {
        invoice: notifications.filter(n => n.category === 'invoice'),
        contract: notifications.filter(n => n.category === 'contract'),
        payment: notifications.filter(n => n.category === 'payment'),
        maintenance: notifications.filter(n => n.category === 'maintenance'),
        other: notifications.filter(n => !['invoice', 'contract', 'payment', 'maintenance'].includes(n.category))
    };

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Benachrichtigungszentrum</h1>
                    <p className="vf-page-subtitle">{unreadNotifications.length} ungelesene Nachrichten</p>
                </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Bell className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{notifications.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt</div>
                    </CardContent>
                </Card>

                {Object.entries(categorizedNotifications).map(([category, items]) => (
                    items.length > 0 && (
                        <Card key={category}>
                            <CardContent className="p-6">
                                <div className="text-3xl font-bold">{items.length}</div>
                                <div className="text-sm text-gray-600 mt-1 capitalize">{category}</div>
                            </CardContent>
                        </Card>
                    )
                ))}
            </div>

            <Card className="border-blue-300 bg-blue-50">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Ungelesene Benachrichtigungen ({unreadNotifications.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {unreadNotifications.map((notif) => (
                            <div key={notif.id} className="p-4 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{notif.title}</div>
                                        <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {new Date(notif.created_date).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <Button size="sm" variant="ghost">
                                            <CheckCircle className="w-4 h-4 text-blue-600" />
                                        </Button>
                                        <Button size="sm" variant="ghost">
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Alle Benachrichtigungen</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{notif.title}</div>
                                        <div className="text-xs text-gray-600 mt-1">{notif.message}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={notif.type === 'error' ? 'vf-badge-error' : notif.type === 'warning' ? 'vf-badge-warning' : 'vf-badge-success'}>
                                            {notif.type}
                                        </Badge>
                                        {notif.is_read && <CheckCircle className="w-4 h-4 text-green-600" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}