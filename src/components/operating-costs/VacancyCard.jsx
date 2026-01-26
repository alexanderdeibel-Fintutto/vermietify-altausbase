import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Calendar } from 'lucide-react';
import { calculateDaysBetween, formatGermanDate } from '../../utils/dateHelpers';

export default function VacancyCard({ vacancy, unit }) {
  const days = calculateDaysBetween(vacancy.vacancy_start, vacancy.vacancy_end);

  return (
    <Card className="p-4 bg-orange-50 border-orange-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-orange-600" />
            <p className="font-medium">Leerstand</p>
            <Badge variant="outline" className="bg-white">
              {unit?.unit_number}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-3 h-3" />
            {formatGermanDate(vacancy.vacancy_start)} - 
            {formatGermanDate(vacancy.vacancy_end)}
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {days} Tage Leerstand • {unit?.wohnflaeche_qm} m²
          </p>
        </div>
      </div>
    </Card>
  );
}