import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function DeadlineTracker({ submissions, taxYear }) {
  const currentYear = taxYear || new Date().getFullYear();
  
  // Steuertermine für Deutschland
  const deadlines = [
    { 
      form: 'ANLAGE_V', 
      deadline: `${currentYear + 1}-07-31`, 
      label: 'Anlage V',
      description: 'Einkünfte aus Vermietung und Verpachtung'
    },
    { 
      form: 'EUER', 
      deadline: `${currentYear + 1}-07-31`, 
      label: 'EÜR',
      description: 'Einnahmen-Überschuss-Rechnung'
    },
    { 
      form: 'GEWERBESTEUER', 
      deadline: `${currentYear + 1}-07-31`, 
      label: 'Gewerbesteuer',
      description: 'Gewerbesteuererklärung'
    },
    { 
      form: 'UMSATZSTEUER', 
      deadline: `${currentYear + 1}-07-31`, 
      label: 'Umsatzsteuer',
      description: 'Umsatzsteuererklärung'
    }
  ];

  const getDeadlineStatus = (deadline, formType) => {
    const deadlineDate = parseISO(deadline);
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);

    const hasSubmission = submissions.some(
      s => s.tax_form_type === formType && 
           s.tax_year === currentYear && 
           s.status === 'ACCEPTED'
    );

    if (hasSubmission) {
      return { status: 'completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
    }

    if (daysRemaining < 0) {
      return { status: 'overdue', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' };
    }

    if (daysRemaining < 30) {
      return { status: 'urgent', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' };
    }

    return { status: 'pending', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Fristen-Tracker {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deadlines.map(dl => {
          const deadlineDate = parseISO(dl.deadline);
          const daysRemaining = differenceInDays(deadlineDate, new Date());
          const statusInfo = getDeadlineStatus(dl.deadline, dl.form);
          const Icon = statusInfo.icon;

          return (
            <Alert key={dl.form} className={statusInfo.bg}>
              <Icon className={`h-4 w-4 ${statusInfo.color}`} />
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{dl.label}</div>
                    <div className="text-xs text-slate-600 mt-1">{dl.description}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Frist: {new Date(dl.deadline).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div className="text-right">
                    {statusInfo.status === 'completed' ? (
                      <Badge className="bg-green-600">Eingereicht</Badge>
                    ) : statusInfo.status === 'overdue' ? (
                      <Badge variant="destructive">Überfällig</Badge>
                    ) : statusInfo.status === 'urgent' ? (
                      <Badge className="bg-orange-600">
                        {daysRemaining} Tage
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {daysRemaining} Tage
                      </Badge>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}