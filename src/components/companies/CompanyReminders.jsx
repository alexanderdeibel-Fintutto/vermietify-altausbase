import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

const reminderTemplates = {
  gmbh: [
    { title: 'Jahresabschluss', dueMonth: 12, dueDay: 31, priority: 'high' },
    { title: 'Quartalssteuererklärung', dueDay: 10, recurring: 'monthly', priority: 'high' },
    { title: 'Geschäftsführer-Sozialversicherung', dueMonth: 3, dueDay: 15, priority: 'medium' }
  ],
  ag: [
    { title: 'Jahresabschluss', dueMonth: 5, dueDay: 31, priority: 'high' },
    { title: 'Hauptversammlung', dueMonth: 8, dueDay: 31, priority: 'high' },
    { title: 'Quartalsbericht', dueDay: 10, recurring: 'monthly', priority: 'medium' }
  ],
  ev: [
    { title: 'Mitgliederversammlung', dueMonth: 12, dueDay: 31, priority: 'high' },
    { title: 'Jahresbericht', dueMonth: 12, dueDay: 31, priority: 'high' }
  ]
};

export default function CompanyReminders({ legalForm, companyId }) {
  const [reminders, setReminders] = useState(reminderTemplates[legalForm] || []);

  const calculateNextDue = (reminder) => {
    const today = new Date();
    const thisYear = today.getFullYear();
    
    if (reminder.dueMonth) {
      const dueDate = new Date(thisYear, reminder.dueMonth - 1, reminder.dueDay);
      if (dueDate < today) {
        return new Date(thisYear + 1, reminder.dueMonth - 1, reminder.dueDay);
      }
      return dueDate;
    }
    return addDays(today, reminder.dueDay || 30);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-5 h-5" />
          Compliance-Fristen ({legalForm})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map((reminder, idx) => {
            const nextDue = calculateNextDue(reminder);
            const daysUntilDue = differenceInDays(nextDue, new Date());
            const isOverdue = daysUntilDue < 0;
            const isUrgent = daysUntilDue <= 30 && daysUntilDue >= 0;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  isOverdue
                    ? 'bg-red-50 border-red-200'
                    : isUrgent
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm text-slate-900">{reminder.title}</h4>
                  <Badge className={priorityColors[reminder.priority]} className="text-xs">
                    {reminder.priority === 'high' ? 'Dringend' : reminder.priority === 'medium' ? 'Wichtig' : 'Normal'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(nextDue, 'dd. MMMM yyyy', { locale: de })}
                    {isOverdue && (
                      <span className="ml-2 text-red-600 font-medium">
                        ({Math.abs(daysUntilDue)} Tage überfällig)
                      </span>
                    )}
                    {isUrgent && !isOverdue && (
                      <span className="ml-2 text-yellow-600 font-medium">
                        ({daysUntilDue} Tage verbleibend)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}

          {reminders.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-4">Keine Fristen für diese Rechtsform</p>
          )}
        </div>

        <Button variant="outline" className="w-full mt-4">
          <Bell className="w-4 h-4 mr-2" />
          Erinnerung aktivieren
        </Button>
      </CardContent>
    </Card>
  );
}