import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MeterReplacementAlertsWidget() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        loadAlerts();
    }, []);

    async function loadAlerts() {
        const data = await base44.entities.MeterReplacementAlert.filter({
            status: { $in: ['pending', 'acknowledged'] }
        }, '-priority');
        setAlerts(data);
    }

    async function acknowledge(id) {
        try {
            await base44.entities.MeterReplacementAlert.update(id, { status: 'acknowledged' });
            toast.success('Bestätigt');
            loadAlerts();
        } catch (error) {
            toast.error('Fehler');
        }
    }

    async function schedule(id) {
        try {
            await base44.entities.MeterReplacementAlert.update(id, { status: 'scheduled' });
            toast.success('Ersatz eingeplant');
            loadAlerts();
        } catch (error) {
            toast.error('Fehler');
        }
    }

    const priorityConfig = {
        urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Dringend' },
        high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Hoch' },
        medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mittel' },
        low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Niedrig' }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Zähler-Ersatz Benachrichtigungen
                    </CardTitle>
                    {alerts.length > 0 && (
                        <Badge variant="destructive">{alerts.length}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        Alle Zähler in Ordnung
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map(alert => {
                            const config = priorityConfig[alert.priority];
                            return (
                                <div key={alert.id} className={`p-4 border-l-4 rounded ${config.bg} border-l-${alert.priority === 'urgent' ? 'red' : alert.priority === 'high' ? 'orange' : 'yellow'}-500`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={`${config.bg} ${config.text}`}>
                                                    {config.label}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {alert.alert_type === 'calibration_due' ? '📅 Eichfrist' :
                                                     alert.alert_type === 'age_based' ? '⏰ Alter' :
                                                     alert.alert_type === 'usage_anomaly' ? '📊 Anomalie' :
                                                     '⚡ Effizienz'}
                                                </span>
                                            </div>
                                            <div className="text-sm font-semibold mb-1">
                                                {alert.recommended_action}
                                            </div>
                                            <div className="flex gap-4 text-xs text-slate-600 mt-2">
                                                {alert.days_until_required !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {alert.days_until_required > 0 
                                                            ? `In ${alert.days_until_required} Tagen`
                                                            : 'Überfällig'}
                                                    </div>
                                                )}
                                                {alert.estimated_cost > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        ca. {alert.estimated_cost} €
                                                    </div>
                                                )}
                                                <div>Konfidenz: {alert.ai_confidence}%</div>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                {alert.status === 'pending' && (
                                                    <Button size="sm" variant="outline" onClick={() => acknowledge(alert.id)}>
                                                        Bestätigen
                                                    </Button>
                                                )}
                                                <Button size="sm" onClick={() => schedule(alert.id)}>
                                                    Austausch planen
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}