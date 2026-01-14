import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, Info } from 'lucide-react';
import { addMonths, format, differenceInMonths } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ContractTermCalculator({ contract }) {
  if (!contract) return null;

  const calculateNoticePeriod = () => {
    if (!contract.start_date) return null;

    const startDate = new Date(contract.start_date);
    const now = new Date();
    const monthsElapsed = differenceInMonths(now, startDate);

    // Gesetzliche Kündigungsfristen nach § 573c BGB
    let noticePeriodMonths = 3; // Standard
    
    if (monthsElapsed >= 60) { // 5 Jahre
      noticePeriodMonths = 6;
    } else if (monthsElapsed >= 96) { // 8 Jahre
      noticePeriodMonths = 9;
    }

    // Custom notice period from contract
    if (contract.notice_period_months) {
      noticePeriodMonths = Math.max(noticePeriodMonths, contract.notice_period_months);
    }

    const earliestEndDate = addMonths(now, noticePeriodMonths);
    
    // Kündigung zum Monatsende
    const earliestEndDateMonthEnd = new Date(
      earliestEndDate.getFullYear(),
      earliestEndDate.getMonth() + 1,
      0
    );

    return {
      noticePeriodMonths,
      earliestEndDate: earliestEndDateMonthEnd,
      reason: monthsElapsed >= 96 ? '9 Monate (>8 Jahre Mietdauer)' :
              monthsElapsed >= 60 ? '6 Monate (>5 Jahre Mietdauer)' :
              '3 Monate (Standardfrist)'
    };
  };

  const noticePeriod = calculateNoticePeriod();

  if (!noticePeriod) return null;

  const isLongTerm = noticePeriod.noticePeriodMonths > 3;

  return (
    <Card className={`p-4 ${isLongTerm ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start gap-3">
        <Calendar className={`w-5 h-5 mt-0.5 ${isLongTerm ? 'text-amber-600' : 'text-blue-600'}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className={`font-medium ${isLongTerm ? 'text-amber-900' : 'text-blue-900'}`}>
              Gesetzliche Kündigungsfrist
            </p>
            <Badge variant="outline" className="text-xs">
              {noticePeriod.reason}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${isLongTerm ? 'text-amber-600' : 'text-blue-600'}`} />
              <p className={`text-sm ${isLongTerm ? 'text-amber-800' : 'text-blue-800'}`}>
                Frühestmögliches Vertragsende: <strong>
                  {format(noticePeriod.earliestEndDate, 'dd. MMMM yyyy', { locale: de })}
                </strong>
              </p>
            </div>
            
            <p className={`text-xs ${isLongTerm ? 'text-amber-700' : 'text-blue-700'}`}>
              <Info className="w-3 h-3 inline mr-1" />
              Bei Kündigung heute ({format(now, 'dd.MM.yyyy')}) würde Vertrag zum {format(noticePeriod.earliestEndDate, 'dd.MM.yyyy')} enden
            </p>

            {contract.contract_type === 'limited' && contract.end_date && (
              <p className="text-xs text-slate-600 mt-2">
                ⚠️ Befristeter Vertrag endet automatisch am {format(new Date(contract.end_date), 'dd.MM.yyyy')} ohne Kündigung
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}