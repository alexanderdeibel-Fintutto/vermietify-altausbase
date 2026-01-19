import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VfSelect } from '@/components/shared/VfSelect';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { showSuccess } from '@/components/notifications/ToastNotification';

const typeIcons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
};

const typeBadges = {
    info: 'vf-badge-info',
    success: 'vf-badge-success',
    warning: 'vf-badge-warning',
    error: 'vf-badge-error'
};

export default function NotificationCenterEnhanced() {
    const [filter, setFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const user = await base44.auth.me();
            return base44.entities.Notification.filter({ recipient_email: user.email }, '-created_date');
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSuccess('Benachrichtigung gelöscht');
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const unread = notifications.filter(n => !n.is_read);
            await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSuccess('Alle als gelesen markiert');
        }
    });

    const filteredNotifications = filter === 'all' 
        ? notifications 
        : filter === 'unread' 
            ? notifications.filter(n => !n.is_read)
            : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Benachrichtigungen</h1>
                    <p className="vf-page-subtitle">
                        {unreadCount > 0 ? `${unreadCount} ungelesene` : 'Keine ungelesenen'} Benachrichtigungen
                    </p>
                </div>
                <div className="vf-page-actions">
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={() => markAllAsReadMutation.mutate()}>
                            <CheckCircle className="w-4 h-4" />
                            Alle als gelesen markieren
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-4">
                <VfSelect
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { value: 'all', label: 'Alle' },
                        { value: 'unread', label: 'Ungelesen' },
                        { value: 'info', label: 'Info' },
                        { value: 'success', label: 'Erfolg' },
                        { value: 'warning', label: 'Warnung' },
                        { value: 'error', label: 'Fehler' }
                    ]}
                />
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600">Keine Benachrichtigungen</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                        const Icon = typeIcons[notification.type] || Info;
                        return (
                            <Card key={notification.id} className={!notification.is_read ? 'border-l-4 border-l-blue-600' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            notification.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                            notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">{notification.title}</h3>
                                                    <p className="text-sm text-gray-600">{notification.message}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <Badge className={typeBadges[notification.type]}>
                                                            {notification.type}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {format(new Date(notification.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {!notification.is_read && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => markAsReadMutation.mutate(notification.id)}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteMutation.mutate(notification.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
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