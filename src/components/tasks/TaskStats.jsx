import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';

export default function TaskStats({ tasks }) {
    const openTasks = tasks.filter(t => t.status === 'offen' || t.status === 'in_bearbeitung').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const dueToday = tasks.filter(t => {
        if (!t.due_date || t.status === 'erledigt' || t.status === 'abgebrochen') return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= today && dueDate <= todayEnd;
    }).length;
    
    const overdue = tasks.filter(t => {
        if (!t.due_date || t.status === 'erledigt' || t.status === 'abgebrochen') return false;
        const dueDate = new Date(t.due_date);
        return dueDate < today;
    }).length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedThisWeek = tasks.filter(t => {
        if (!t.completed_at) return false;
        const completedDate = new Date(t.completed_at);
        return completedDate >= oneWeekAgo;
    }).length;

    const stats = [
        {
            title: "Offene Tasks",
            value: openTasks,
            icon: ListTodo,
            color: "bg-white text-slate-700",
            iconBg: "bg-slate-50"
        },
        {
            title: "Heute fällig",
            value: dueToday,
            icon: Clock,
            color: "bg-white text-slate-700",
            iconBg: "bg-slate-50"
        },
        {
            title: "Überfällig",
            value: overdue,
            icon: AlertTriangle,
            color: "bg-white text-slate-700",
            iconBg: "bg-slate-50"
        },
        {
            title: "Diese Woche erledigt",
            value: completedThisWeek,
            icon: CheckCircle2,
            color: "bg-white text-slate-700",
            iconBg: "bg-slate-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <Card key={index} className={`${stat.color} border-slate-100 shadow-none`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-extralight text-slate-400">{stat.title}</p>
                                <p className="text-3xl font-extralight mt-3">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                                <stat.icon className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}