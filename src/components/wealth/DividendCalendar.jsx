import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DividendCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: dividends = [] } = useQuery({
    queryKey: ['dividends'],
    queryFn: async () => {
      const all = await base44.entities.Dividend.list();
      return all.sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  // Gruppiere Dividenden nach Datum
  const dividendsByDate = dividends.reduce((acc, div) => {
    const date = new Date(div.payment_date).toLocaleDateString('de-DE');
    if (!acc[date]) acc[date] = [];
    acc[date].push(div);
    return acc;
  }, {});

  // Berechne Statistiken für aktuellen Monat
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const monthDividends = dividends.filter(d => {
    const date = new Date(d.payment_date);
    return date >= monthStart && date <= monthEnd;
  });

  const totalMonthly = monthDividends.reduce((sum, d) => sum + (d.amount_net || 0), 0);
  const upcomingNextMonth = dividends.filter(d => {
    const date = new Date(d.payment_date);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const nextMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
    return date >= nextMonth && date <= nextMonthEnd;
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Dividenden-Kalender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Monthly Summary */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Erwartete Dividenden</p>
          <p className="text-lg font-bold text-blue-900">
            {totalMonthly.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
              {day}
            </div>
          ))}
          {days.map((date, idx) => {
            const dateStr = date ? date.toLocaleDateString('de-DE') : '';
            const dayDividends = dateStr ? dividendsByDate[dateStr] || [] : [];

            return (
              <div
                key={idx}
                className={`p-2 border rounded text-xs min-h-12 flex flex-col justify-start ${
                  date ? 'bg-white' : 'bg-slate-50'
                } ${dayDividends.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}
              >
                {date && (
                  <>
                    <span className="font-semibold text-slate-700">{date.getDate()}</span>
                    {dayDividends.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {dayDividends.slice(0, 2).map((div, idx) => (
                          <Badge key={idx} className="text-xs bg-green-100 text-green-800">
                            {(div.amount_net || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </Badge>
                        ))}
                        {dayDividends.length > 2 && (
                          <span className="text-xs text-slate-600">+{dayDividends.length - 2}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming */}
        {upcomingNextMonth.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-slate-900 mb-2">
              Nächsten Monat erwartet:
            </p>
            <div className="bg-amber-50 p-3 rounded border border-amber-200">
              <p className="text-lg font-bold text-amber-900">
                {upcomingNextMonth.reduce((sum, d) => sum + (d.amount_net || 0), 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}