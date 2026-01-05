import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TaskCalendar({ tasks, priorities, onTaskClick }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getTasksForDay = (day) => {
        return tasks.filter(task => {
            if (!task.due_date) return false;
            return isSameDay(parseISO(task.due_date), day);
        });
    };

    const getPriorityColor = (priorityId) => {
        const priority = priorities.find(p => p.id === priorityId);
        return priority?.color_code || '#6b7280';
    };

    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleToday = () => {
        setCurrentMonth(new Date());
    };

    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    // Adjust days to start on Monday
    const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Convert to Monday-based
    const leadingEmptyDays = Array(firstDayOfWeek).fill(null);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                            {format(currentMonth, 'MMMM yyyy', { locale: de })}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleToday}>
                                Heute
                            </Button>
                            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {/* Week day headers */}
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-slate-600 pb-2">
                                {day}
                            </div>
                        ))}

                        {/* Leading empty days */}
                        {leadingEmptyDays.map((_, index) => (
                            <div key={`empty-${index}`} className="min-h-[100px]" />
                        ))}

                        {/* Calendar days */}
                        {daysInMonth.map((day) => {
                            const dayTasks = getTasksForDay(day);
                            const isCurrentDay = isToday(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`min-h-[100px] border rounded-lg p-2 ${
                                        isCurrentDay ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                                    }`}
                                >
                                    <div className={`text-sm font-medium mb-2 ${
                                        isCurrentDay ? 'text-emerald-700' : 'text-slate-600'
                                    }`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayTasks.slice(0, 3).map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => onTaskClick(task)}
                                                className="text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow"
                                                style={{
                                                    backgroundColor: getPriorityColor(task.priority_id) + '15',
                                                    borderLeft: `3px solid ${getPriorityColor(task.priority_id)}`
                                                }}
                                            >
                                                <div className="font-medium truncate text-slate-800">
                                                    {task.title}
                                                </div>
                                            </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <div className="text-xs text-slate-500 pl-1">
                                                +{dayTasks.length - 3} weitere
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}