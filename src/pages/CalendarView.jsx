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

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const navigate = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const getEventsForDay = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.faelligkeitsdatum === dateStr);
        const endingContracts = contracts.filter(c => c.mietende?.startsWith(dateStr));
        return [...dayTasks.map(t => ({ type: 'task', ...t })), ...endingContracts.map(c => ({ type: 'contract', ...c }))];
    };

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
                        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="font-semibold text-lg">
                            {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => navigate(1)}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-center text-sm font-semibold text-gray-600 py-2">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-20"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const events = getEventsForDay(day);
                            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                            return (
                                <div key={day} className={`h-20 p-1 border rounded ${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}>
                                    <div className={`text-sm font-semibold ${isToday ? 'text-blue-700' : ''}`}>{day}</div>
                                    {events.slice(0, 2).map((e, idx) => (
                                        <Badge key={idx} className={`text-xs mt-1 block truncate ${e.type === 'task' ? 'vf-badge-warning' : 'vf-badge-info'}`}>
                                            {e.titel || e.einheit}
                                        </Badge>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}