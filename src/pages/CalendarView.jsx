import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list()
    });

    const { data: maintenanceTasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list()
    });

    const allEvents = [
        ...tasks.map(t => ({ ...t, type: 'task', date: t.faelligkeitsdatum })),
        ...maintenanceTasks.map(m => ({ ...m, type: 'maintenance', date: m.faelligkeit }))
    ].filter(e => e.date);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const previousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const getEventsForDay = (day) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return allEvents.filter(e => e.date?.startsWith(dateStr));
    };

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kalender</h1>
                    <p className="vf-page-subtitle">Termine & Aufgaben</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="outline" size="sm" onClick={previousMonth}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h2 className="text-2xl font-bold">{monthNames[currentMonth]} {currentYear}</h2>
                        <Button variant="outline" size="sm" onClick={nextMonth}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center font-semibold text-sm text-gray-500 p-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for alignment */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square p-2" />
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const events = getEventsForDay(day);
                            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                            return (
                                <div
                                    key={day}
                                    className={`aspect-square p-2 border rounded-lg ${isToday ? 'border-blue-600 bg-blue-50' : 'border-gray-200'} ${events.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                >
                                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-1">
                                        {events.slice(0, 2).map((event, idx) => (
                                            <div
                                                key={idx}
                                                className={`text-xs px-1 py-0.5 rounded truncate ${
                                                    event.type === 'task' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}
                                                title={event.titel || event.title}
                                            >
                                                {event.titel || event.title}
                                            </div>
                                        ))}
                                        {events.length > 2 && (
                                            <div className="text-xs text-gray-500">+{events.length - 2} mehr</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Anstehende Termine</h3>
                    <div className="space-y-3">
                        {allEvents
                            .filter(e => new Date(e.date) >= new Date())
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .slice(0, 5)
                            .map((event, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <div className="font-medium">{event.titel || event.title}</div>
                                            <div className="text-sm text-gray-600">
                                                {new Date(event.date).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={event.type === 'task' ? 'vf-badge-primary' : 'vf-badge-warning'}>
                                        {event.type === 'task' ? 'Aufgabe' : 'Wartung'}
                                    </Badge>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}