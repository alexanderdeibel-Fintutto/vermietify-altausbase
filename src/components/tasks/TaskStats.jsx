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
            color: "bg-blue-50 text-blue-600",
            iconBg: "bg-blue-100"
        },
        {
            title: "Heute fällig",
            value: dueToday,
            icon: Clock,
            color: "bg-orange-50 text-orange-600",
            iconBg: "bg-orange-100"
        },
        {
            title: "Überfällig",
            value: overdue,
            icon: AlertTriangle,
            color: "bg-red-50 text-red-600",
            iconBg: "bg-red-100"
        },
        {
            title: "Diese Woche erledigt",
            value: completedThisWeek,
            icon: CheckCircle2,
            color: "bg-green-50 text-green-600",
            iconBg: "bg-green-100"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className={stat.color}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-80">{stat.title}</p>
                                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}