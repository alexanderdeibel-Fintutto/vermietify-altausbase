import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GeneratedBookingsWidget() {
    const { data: bookings = [] } = useQuery({
        queryKey: ['generatedBookings'],
        queryFn: () => base44.entities.GeneratedFinancialBooking.list('-due_date', 50)
    });

    const upcomingBookings = bookings
        .filter(b => {
            const dueDate = new Date(b.due_date);
            const today = new Date();
            const in30Days = new Date();
            in30Days.setDate(in30Days.getDate() + 30);
            return dueDate >= today && dueDate <= in30Days && b.booking_status !== 'Bezahlt';
        })
        .slice(0, 5);

    const overdueBookings = bookings.filter(b => {
        const dueDate = new Date(b.due_date);
        const today = new Date();
        return dueDate < today && b.booking_status !== 'Bezahlt';
    });

    const totalUpcoming = upcomingBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Anstehende Buchungen</CardTitle>
                <Link to={createPageUrl('GeneratedBookings')}>
                    <Button variant="ghost" size="sm" className="gap-1">
                        Alle anzeigen
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {overdueBookings.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">{overdueBookings.length} überfällige Buchungen</span>
                        </div>
                    </div>
                )}

                {upcomingBookings.length === 0 ? (
                    <div className="text-center py-6 text-slate-600">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm">Keine anstehenden Buchungen</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 mb-4">
                            {upcomingBookings.map(booking => (
                                <div key={booking.id} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-start justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-800">
                                            {booking.description}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {booking.source_type}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(booking.due_date).toLocaleDateString('de-DE')}
                                        </div>
                                        <span className="font-medium">
                                            {booking.amount.toLocaleString('de-DE', { 
                                                style: 'currency', 
                                                currency: 'EUR' 
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Gesamt nächste 30 Tage:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    {totalUpcoming.toLocaleString('de-DE', { 
                                        style: 'currency', 
                                        currency: 'EUR' 
                                    })}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}