import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ContractTimeline({ 
  events = [],
  currentStep = 0
}) {
  const getIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'current':
        return Clock;
      case 'pending':
      default:
        return AlertCircle;
    }
  };

  const getColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600';
      case 'current':
        return 'text-blue-600';
      case 'pending':
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="relative">
      {events.map((event, idx) => {
        const Icon = getIcon(event.status);
        const color = getColor(event.status);

        return (
          <div key={idx} className="flex gap-4 pb-8">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <Icon className={`w-6 h-6 ${color}`} />
              {idx < events.length - 1 && (
                <div
                  className={`w-0.5 h-16 my-2 ${
                    event.status === 'completed'
                      ? 'bg-emerald-600'
                      : 'bg-slate-300'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h4 className="font-semibold text-slate-900">{event.title}</h4>
              {event.description && (
                <p className="text-sm text-slate-600 mt-1">{event.description}</p>
              )}
              {event.date && (
                <p className="text-xs text-slate-500 mt-2">
                  {format(new Date(event.date), 'PPP', { locale: de })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}