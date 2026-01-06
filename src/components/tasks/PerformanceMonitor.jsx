import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PerformanceMonitor() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['performanceStats'],
        queryFn: async () => {
            const [tasks, automations, emails, logs] = await Promise.all([
                base44.entities.Task.list('-created_date', 1000),
                base44.entities.Automation.list(),
                base44.entities.Email.list('-created_date', 100),
                base44.entities.ActivityLog.list('-created_date', 100)
            ]);

            // Fehlerrate berechnen
            const errorLogs = logs.filter(l => l.error_details);
            const errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;

            // Task-Statistiken
            const tasksByStatus = tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});

            // Email-Verarbeitung
            const processedEmails = emails.filter(e => e.is_processed).length;
            const emailProcessingRate = emails.length > 0 
                ? (processedEmails / emails.length) * 100 
                : 0;

            // Aktive Automatisierungen
            const activeAutomations = automations.filter(a => a.is_active).length;

            return {
                tasksByStatus,
                errorRate,
                emailProcessingRate,
                activeAutomations,
                totalTasks: tasks.length,
                totalEmails: emails.length,
                totalLogs: logs.length
            };
        },
        refetchInterval: 60000, // Alle 60 Sekunden
        staleTime: 30000 // Cache für 30 Sekunden
    });

    if (isLoading || !stats) {
        return <div className="text-center py-8 text-slate-500">Lädt Performance-Daten...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                        Tasks Total
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-600" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">
                                {stats.totalTasks}
                            </div>
                            <div className="text-xs text-slate-500">
                                {stats.tasksByStatus.offen || 0} offen
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                        Email-Verarbeitung
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">
                                {stats.emailProcessingRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500">
                                {stats.totalEmails} Emails
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                        Automatisierungen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-amber-600" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">
                                {stats.activeAutomations}
                            </div>
                            <div className="text-xs text-slate-500">
                                Aktiv
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                        Fehlerrate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-8 h-8 ${
                            stats.errorRate > 10 ? 'text-red-600' : 
                            stats.errorRate > 5 ? 'text-amber-600' : 
                            'text-green-600'
                        }`} />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">
                                {stats.errorRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500">
                                {stats.totalLogs} Logs
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}