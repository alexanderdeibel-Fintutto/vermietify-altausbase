import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight, Home, User } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function UnitAvailabilityCalendar({ unitId }) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['unit-contracts', unitId],
        queryFn: () => base44.entities.LeaseContract.filter({ unit_id: unitId })
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);

    const goToPreviousMonth = () => setCurrentMonth(prev => addMonths(prev, -1));
    const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Get contract for a specific date
    const getContractForDate = (date) => {
        return contracts.find(contract => {
            const start = parseISO(contract.start_date);
            const end = contract.end_date && !contract.is_unlimited ? parseISO(contract.end_date) : new Date(2100, 0, 1);
            return isWithinInterval(date, { start, end });
        });
    };

    // Calculate upcoming events
    const upcomingEvents = React.useMemo(() => {
        const events = [];
        const today = new Date();

        contracts.forEach(contract => {
            const startDate = parseISO(contract.start_date);
            const tenant = getTenant(contract.tenant_id);

            // Move-in (if in future)
            if (isAfter(startDate, today)) {
                events.push({
                    date: startDate,
                    type: 'move-in',
                    tenant: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt',
                    contract
                });
            }

            // Move-out (if contract has end date and is in future)
            if (contract.end_date && !contract.is_unlimited) {
                const endDate = parseISO(contract.end_date);
                if (isAfter(endDate, today)) {
                    events.push({
                        date: endDate,
                        type: 'move-out',
                        tenant: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt',
                        contract
                    });
                }
            }
        });

        return events.sort((a, b) => a.date - b.date).slice(0, 5);
    }, [contracts, tenants]);

    // Get current occupancy
    const currentContract = getContractForDate(new Date());
    const currentTenant = currentContract ? getTenant(currentContract.tenant_id) : null;

    if (isLoading) {
        return <Skeleton className="h-96 rounded-xl" />;
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get weekday of first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = monthStart.getDay();
    const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Convert to Monday = 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        Verfügbarkeitskalender
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Heute
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToNextMonth}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-600 mb-2">Aktueller Status</p>
                    {currentContract && currentTenant ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-800">
                                    {currentTenant.first_name} {currentTenant.last_name}
                                </span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">Vermietet</Badge>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-800">Leer stehend</span>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700">Verfügbar</Badge>
                        </div>
                    )}
                </div>

                {/* Calendar Grid */}
                <div>
                    <div className="text-center font-semibold text-slate-800 mb-4">
                        {format(currentMonth, 'MMMM yyyy', { locale: de })}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Weekday headers */}
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for padding */}
                        {[...Array(startPadding)].map((_, i) => (
                            <div key={`pad-${i}`} />
                        ))}

                        {/* Days */}
                        {daysInMonth.map(day => {
                            const contract = getContractForDate(day);
                            const isOccupied = !!contract;
                            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "aspect-square flex items-center justify-center text-sm rounded-lg border",
                                        isOccupied ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-white border-slate-200 text-slate-600",
                                        isToday && "ring-2 ring-blue-500"
                                    )}
                                >
                                    {format(day, 'd')}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded" />
                            <span className="text-slate-600">Vermietet</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border border-slate-200 rounded" />
                            <span className="text-slate-600">Verfügbar</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-3">Anstehende Ereignisse</p>
                        <div className="space-y-2">
                            {upcomingEvents.map((event, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            {event.type === 'move-in' ? 'Einzug' : 'Auszug'}: {event.tenant}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {format(event.date, 'dd. MMMM yyyy', { locale: de })}
                                        </p>
                                    </div>
                                    <Badge 
                                        className={
                                            event.type === 'move-in' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-amber-100 text-amber-700'
                                        }
                                    >
                                        {event.type === 'move-in' ? 'Einzug' : 'Auszug'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}