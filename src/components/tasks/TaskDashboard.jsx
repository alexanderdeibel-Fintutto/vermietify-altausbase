import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    TrendingUp,
    Zap,
    Mail,
    FileText,
    Settings
} from 'lucide-react';

export default function TaskDashboard() {
    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list()
    });

    const { data: workflows = [] } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => base44.entities.Workflow.list()
    });

    const { data: automations = [] } = useQuery({
        queryKey: ['automations'],
        queryFn: () => base44.entities.Automation.list()
    });

    const { data: emails = [] } = useQuery({
        queryKey: ['emails'],
        queryFn: () => base44.entities.Email.list()
    });

    // Task statistics
    const openTasks = tasks.filter(t => t.status === 'offen').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_bearbeitung').length;
    const completedTasks = tasks.filter(t => t.status === 'erledigt').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Overdue tasks
    const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.status === 'erledigt' || t.status === 'abgebrochen') return false;
        return new Date(t.due_date) < new Date();
    }).length;

    // This week's completed tasks
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekCompleted = tasks.filter(t => {
        if (t.status !== 'erledigt' || !t.completed_at) return false;
        return new Date(t.completed_at) >= weekStart;
    }).length;

    // Workflow & Automation stats
    const activeWorkflows = workflows.filter(w => w.is_active).length;
    const activeAutomations = automations.filter(a => a.is_active).length;
    const unprocessedEmails = emails.filter(e => !e.is_processed).length;

    const stats = [
        {
            title: 'Offene Tasks',
            value: openTasks,
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'In Bearbeitung',
            value: inProgressTasks,
            icon: TrendingUp,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
        },
        {
            title: 'Überfällig',
            value: overdueTasks,
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        },
        {
            title: 'Diese Woche erledigt',
            value: weekCompleted,
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        }
    ];

    const systemStats = [
        {
            title: 'Aktive Workflows',
            value: `${activeWorkflows} / ${workflows.length}`,
            icon: FileText,
            color: 'text-emerald-600'
        },
        {
            title: 'Aktive Automatisierungen',
            value: `${activeAutomations} / ${automations.length}`,
            icon: Zap,
            color: 'text-purple-600'
        },
        {
            title: 'Unbearbeitete Emails',
            value: unprocessedEmails,
            icon: Mail,
            color: 'text-orange-600'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Completion Rate */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Erledigungsquote</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                                {completedTasks} von {totalTasks} Tasks erledigt
                            </span>
                            <span className="font-semibold text-slate-800">
                                {completionRate.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={completionRate} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            {/* System Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-slate-600" />
                        <CardTitle className="text-lg">System-Übersicht</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {systemStats.map((stat, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <div>
                                    <p className="text-xs text-slate-600">{stat.title}</p>
                                    <p className="text-lg font-semibold text-slate-800">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Status-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Offen</span>
                                <span className="font-semibold text-slate-800">{openTasks}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">In Bearbeitung</span>
                                <span className="font-semibold text-slate-800">{inProgressTasks}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Wartend</span>
                                <span className="font-semibold text-slate-800">
                                    {tasks.filter(t => t.status === 'wartend').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Erledigt</span>
                                <span className="font-semibold text-green-600">{completedTasks}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Automatisierung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Workflows aktiv</span>
                                    <span className="font-semibold text-emerald-600">{activeWorkflows}</span>
                                </div>
                                <Progress 
                                    value={workflows.length > 0 ? (activeWorkflows / workflows.length) * 100 : 0} 
                                    className="h-2" 
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Automatisierungen aktiv</span>
                                    <span className="font-semibold text-purple-600">{activeAutomations}</span>
                                </div>
                                <Progress 
                                    value={automations.length > 0 ? (activeAutomations / automations.length) * 100 : 0} 
                                    className="h-2" 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}