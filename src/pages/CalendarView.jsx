import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const upcomingEvents = [
        ...tasks.filter(t => t.faelligkeitsdatum).map(t => ({
            type: 'task',
            date: t.faelligkeitsdatum,
            title: t.titel,
            category: t.kategorie
        })),
        ...payments.filter(p => p.due_date).map(p => ({
            type: 'payment',
            date: p.due_date,
            title: `Zahlung fällig`,
            amount: p.amount
        }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10);

    const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kalender</h1>
                    <p className="vf-page-subtitle">Termine & Fristen</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">{monthName}</h2>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>
                                Heute
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }, (_, i) => {
                            const day = i - 5;
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isToday = date.toDateString() === new Date().toDateString();
                            
                            return (
                                <div 
                                    key={i} 
                                    className={`aspect-square p-2 border rounded-lg text-center ${isToday ? 'bg-blue-100 border-blue-400' : 'bg-gray-50'}`}
                                >
                                    <div className="text-sm">{date.getDate()}</div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Anstehende Termine</h3>
                    <div className="space-y-2">
                        {upcomingEvents.map((event, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">{event.title}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {new Date(event.date).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <Badge className={event.type === 'task' ? 'vf-badge-primary' : 'vf-badge-warning'}>
                                        {event.type === 'task' ? 'Aufgabe' : 'Zahlung'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}