import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function DateRangeSelector({ fromDate, toDate, onFromDateChange, onToDateChange }) {
  const setQuickRange = (days) => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    
    onFromDateChange(from.toISOString().split('T')[0]);
    onToDateChange(to.toISOString().split('T')[0]);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Zeitraum</span>
          </div>

          {/* Quick Range Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickRange(7)}
              className="text-xs"
            >
              7 Tage
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickRange(30)}
              className="text-xs"
            >
              30 Tage
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickRange(90)}
              className="text-xs"
            >
              90 Tage
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickRange(365)}
              className="text-xs"
            >
              1 Jahr
            </Button>
          </div>

          {/* Custom Range */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Von</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Bis</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}