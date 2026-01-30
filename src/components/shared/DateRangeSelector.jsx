import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DateRangeSelector({ from, to, onSelect }) {
  const [date, setDate] = React.useState({ from, to });

  React.useEffect(() => {
    setDate({ from, to });
  }, [from, to]);

  const handleSelect = (range) => {
    setDate(range);
    onSelect(range);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2 min-w-64">
          <CalendarIcon className="w-4 h-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'dd.MM.yyyy', { locale: de })} -{' '}
                {format(date.to, 'dd.MM.yyyy', { locale: de })}
              </>
            ) : (
              format(date.from, 'dd.MM.yyyy', { locale: de })
            )
          ) : (
            <span>Zeitraum wählen</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={date}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={de}
        />
      </PopoverContent>
    </Popover>
  );
}