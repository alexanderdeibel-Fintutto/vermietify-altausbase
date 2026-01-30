import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AISmartAlertManager() {
    const [user, setUser] = useState(null);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        loadUser();
        loadAlerts();
        
        // Realtime subscription für neue AI-generierte Alerts
        const unsubscribe = base44.entities.Notification.subscribe((event) => {
            if (event.type === 'create' && event.data.type === 'ai_smart_alert') {
                setAlerts(prev => [event.data, ...prev]);
                toast.info(`🤖 ${event.data.title}`, {
                    description: event.data.message
                });
            }
        });

        return unsubscribe;
    }, []);

    async function loadUser() {
        const u = await base44.auth.me();
        setUser(u);
    }

    async function loadAlerts() {
        const data = await base44.entities.Notification.filter({
            type: 'ai_smart_alert',
            user_email: { $in: ['all', user?.email] }
        }, '-created_date', 20);
        setAlerts(data);
    }

    async function markAsRead(alertId) {
        try {
            await base44.entities.Notification.update(alertId, { is_read: true });
            setAlerts(alerts.map(a => a.id === alertId ? {...a, is_read: true} : a));
        } catch (error) {
            toast.error('Fehler');
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    AI Smart Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Keine AI-Alerts
                        </div>
                    ) : (
                        alerts.map(alert => (
                            <div 
                                key={alert.id}
                                className={`p-3 border rounded-lg ${alert.is_read ? 'opacity-60' : 'bg-blue-50'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold flex items-center gap-2">
                                            {alert.priority === 'high' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                                            {alert.title}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1">{alert.message}</div>
                                        <div className="text-xs text-slate-500 mt-2">
                                            {new Date(alert.created_date).toLocaleString('de-DE')}
                                        </div>
                                    </div>
                                    {!alert.is_read && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => markAsRead(alert.id)}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}