import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ActivityLogViewer({ entityType = null, entityId = null, limit = 50 }) {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['activityLogs', entityType, entityId],
        queryFn: async () => {
            if (entityType && entityId) {
                return base44.entities.ActivityLog.filter({
                    entity_type: entityType,
                    entity_id: entityId
                }, '-created_date', limit);
            }
            return base44.entities.ActivityLog.list('-created_date', limit);
        }
    });

    const getActionColor = (action) => {
        if (action.includes('create') || action.includes('erstellt')) return 'bg-green-100 text-green-800';
        if (action.includes('update') || action.includes('aktualisiert')) return 'bg-blue-100 text-blue-800';
        if (action.includes('delete') || action.includes('gelöscht')) return 'bg-red-100 text-red-800';
        return 'bg-slate-100 text-slate-800';
    };

    if (isLoading) {
        return <div className="text-center py-8 text-slate-500">Lädt Aktivitäten...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Aktivitätsprotokoll
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Keine Aktivitäten vorhanden
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="border-l-2 border-slate-200 pl-4 pb-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <Badge className={getActionColor(log.user_action)}>
                                            {log.user_action}
                                        </Badge>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {format(parseISO(log.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                        <User className="w-4 h-4" />
                                        {log.created_by}
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-slate-500">Entität:</span>{' '}
                                        <span className="font-medium">{log.entity_type}</span>
                                        {log.entity_id && (
                                            <span className="text-slate-400 ml-2">({log.entity_id})</span>
                                        )}
                                    </div>
                                    {log.old_values && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                                Alte Werte
                                            </summary>
                                            <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto">
                                                {JSON.stringify(log.old_values, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                    {log.new_values && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                                Neue Werte
                                            </summary>
                                            <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto">
                                                {JSON.stringify(log.new_values, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                    {log.error_details && (
                                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                            Fehler: {log.error_details}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}