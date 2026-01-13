import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ContractTimeline({ contract }) {
  if (!contract) return null;

  const today = new Date();
  const startDate = new Date(contract.start_date);
  const endDate = contract.end_date ? new Date(contract.end_date) : null;
  const terminationDate = contract.termination_date ? new Date(contract.termination_date) : null;

  const daysActive = differenceInDays(today, startDate);
  const daysUntilEnd = endDate ? differenceInDays(endDate, today) : null;
  const daysUntilTermination = terminationDate ? differenceInDays(terminationDate, today) : null;

  const getStatusColor = (date) => {
    const daysLeft = differenceInDays(date, today);
    if (daysLeft < 0) return 'bg-red-100 text-red-800';
    if (daysLeft < 30) return 'bg-orange-100 text-orange-800';
    if (daysLeft < 90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4 text-sm">Vertrags-Timeline</h4>
      
      <div className="space-y-4">
        {/* Start */}
        <div className="flex gap-4 items-start">
          <div className="flex flex-col items-center">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div className="w-0.5 h-12 bg-slate-200 my-1" />
          </div>
          <div className="flex-1 pt-1">
            <p className="text-xs text-slate-600">Mietbeginn</p>
            <p className="font-medium text-sm">
              {format(startDate, 'dd.MM.yyyy', { locale: de })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              vor {daysActive} Tagen
            </p>
          </div>
        </div>

        {/* Termination */}
        {terminationDate && (
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <LogOut className="w-5 h-5 text-orange-600" />
              <div className="w-0.5 h-12 bg-slate-200 my-1" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-slate-600">Kündigung</p>
              <p className="font-medium text-sm">
                {format(terminationDate, 'dd.MM.yyyy', { locale: de })}
              </p>
              <Badge className={`mt-1 text-xs ${getStatusColor(terminationDate)}`}>
                {daysUntilTermination < 0 
                  ? `vor ${Math.abs(daysUntilTermination)} Tagen`
                  : `in ${daysUntilTermination} Tagen`
                }
              </Badge>
            </div>
          </div>
        )}

        {/* End Date */}
        {endDate && (
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-slate-600">Mietende</p>
              <p className="font-medium text-sm">
                {format(endDate, 'dd.MM.yyyy', { locale: de })}
              </p>
              {daysUntilEnd !== null && (
                <Badge className={`mt-1 text-xs ${getStatusColor(endDate)}`}>
                  {daysUntilEnd < 0 
                    ? `abgelaufen vor ${Math.abs(daysUntilEnd)} Tagen`
                    : `noch ${daysUntilEnd} Tage`
                  }
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Unlimited Info */}
        {contract.is_unlimited && (
          <div className="flex gap-4 items-start mt-2 p-2 bg-blue-50 rounded">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">Unbefristeter Vertrag</p>
          </div>
        )}
      </div>
    </Card>
  );
}