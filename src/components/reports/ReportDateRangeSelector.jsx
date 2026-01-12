import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ReportDateRangeSelector({ dateRange, onDateRangeChange }) {
  const presets = [
    {
      label: 'Aktueller Monat',
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: 'Letzter Monat',
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1))
      })
    },
    {
      label: 'Aktuelles Jahr',
      getValue: () => ({
        from: startOfYear(new Date()),
        to: endOfYear(new Date())
      })
    },
    {
      label: 'Letztes Jahr',
      getValue: () => ({
        from: startOfYear(new Date(new Date().getFullYear() - 1, 0, 1)),
        to: endOfYear(new Date(new Date().getFullYear() - 1, 0, 1))
      })
    }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h3 className="font-medium text-slate-900">Zeitraum wählen</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <Button
                key={preset.label}
                size="sm"
                variant="outline"
                onClick={() => onDateRangeChange(preset.getValue())}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Von</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={format(dateRange.from, 'yyyy-MM-dd')}
                onChange={e => onDateRangeChange({ ...dateRange, from: new Date(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Bis</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={format(dateRange.to, 'yyyy-MM-dd')}
                onChange={e => onDateRangeChange({ ...dateRange, to: new Date(e.target.value) })}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Zeitraum: {format(dateRange.from, 'dd.MM.yyyy', { locale: de })} - {format(dateRange.to, 'dd.MM.yyyy', { locale: de })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}