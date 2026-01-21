import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NotificationCenter() {
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => base44.entities.Notification.list('-created_date')
    });

    const unread = notifications.filter(n => !n.is_read);
    const byType = {
        info: notifications.filter(n => n.type === 'info'),
        warning: notifications.filter(n => n.type === 'warning'),
        error: notifications.filter(n => n.type === 'error'),
        success: notifications.filter(n => n.type === 'success')
    };

    const getIcon = (type) => {
        switch(type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-orange-600" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
            default: return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Benachrichtigungen</h1>
                    <p className="vf-page-subtitle">{unread.length} ungelesen</p>
                </div>
                <Button variant="outline">Alle als gelesen markieren</Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Bell className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{notifications.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-orange-700">{unread.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ungelesen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-700">{byType.error.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kritisch</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{byType.warning.length}</div>
                        <div className="text-sm opacity-90 mt-1">Warnungen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Alle Benachrichtigungen</h3>
                    <div className="space-y-2">
                        {notifications.slice(0, 15).map(n => (
                            <div key={n.id} className={`p-4 rounded-lg border ${!n.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                <div className="flex items-start gap-3">
                                    {getIcon(n.type)}
                                    <div className="flex-1">
                                        <div className="font-semibold">{n.title}</div>
                                        <div className="text-sm text-gray-600">{n.message}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(n.created_date).toLocaleString('de-DE')}
                                        </div>
                                    </div>
                                    {!n.is_read && <Badge className="vf-badge-primary">Neu</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}