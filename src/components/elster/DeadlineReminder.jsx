import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DeadlineReminder({ submissions }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const deadlines = [
    { 
      form: 'UMSATZSTEUER', 
      month: 0, // Januar
      day: 10,
      label: 'Umsatzsteuer-Voranmeldung Dezember',
      recurring: 'monthly'
    },
    { 
      form: 'EST1B', 
      month: 4, // Mai
      day: 31,
      label: 'Einkommensteuererklärung',
      recurring: 'yearly'
    },
    { 
      form: 'GEWERBESTEUER', 
      month: 4, // Mai
      day: 31,
      label: 'Gewerbesteuererklärung',
      recurring: 'yearly'
    },
    { 
      form: 'ANLAGE_V', 
      month: 4, // Mai
      day: 31,
      label: 'Anlage V (Vermietung)',
      recurring: 'yearly'
    }
  ];

  const upcomingDeadlines = deadlines
    .map(deadline => {
      const deadlineDate = new Date(currentYear, deadline.month, deadline.day);
      const daysUntil = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
      const isUpcoming = daysUntil > 0 && daysUntil <= 60;
      const isPast = daysUntil < 0;
      
      const hasSubmission = submissions.some(s => 
        s.tax_form_type === deadline.form && 
        s.tax_year === currentYear &&
        (s.status === 'SUBMITTED' || s.status === 'ACCEPTED')
      );

      return {
        ...deadline,
        daysUntil,
        isUpcoming,
        isPast,
        hasSubmission
      };
    })
    .filter(d => (d.isUpcoming || d.isPast) && !d.hasSubmission)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (upcomingDeadlines.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-medium text-green-900">Alle Fristen eingehalten!</div>
              <div className="text-sm text-green-700">Keine ausstehenden ELSTER-Submissions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Anstehende Fristen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDeadlines.map((deadline, idx) => (
          <Alert 
            key={idx}
            className={deadline.isPast ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}
          >
            <AlertTriangle className={`h-4 w-4 ${deadline.isPast ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className={deadline.isPast ? 'text-red-900' : 'text-yellow-900'}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{deadline.label}</div>
                  <div className="text-xs mt-1">
                    Frist: {deadline.day}.{deadline.month + 1}.{currentYear}
                  </div>
                </div>
                <Badge variant={deadline.isPast ? 'destructive' : 'default'}>
                  {deadline.isPast ? 'Überfällig' : `${deadline.daysUntil} Tage`}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}