import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function NotificationCenter() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => base44.entities.Notification.list('-created_date', 50)
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Notification.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSuccess('Benachrichtigung gelöscht');
        }
    });

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-orange-600" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
            default: return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Benachrichtigungen</h1>
                    <p className="vf-page-subtitle">{unreadCount} ungelesen</p>
                </div>
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Bell className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Keine Benachrichtigungen</h3>
                            <p className="text-gray-600">Sie haben alle Benachrichtigungen gelesen</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card key={notification.id} className={!notification.is_read ? 'border-blue-300 bg-blue-50/50' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">{notification.title}</h3>
                                        <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">
                                                {new Date(notification.created_date).toLocaleDateString('de-DE')}
                                            </span>
                                            {notification.category && (
                                                <Badge className="vf-badge-default text-xs">
                                                    {notification.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(notification.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}