import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, FileText, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SteuerApp() {
  const { data: taxForms = [] } = useQuery({
    queryKey: ['tax-forms'],
    queryFn: () => base44.entities.TaxForm.list('-created_date', 10)
  });

  const { data: taxDeadlines = [] } = useQuery({
    queryKey: ['tax-deadlines'],
    queryFn: () => base44.entities.TaxDeadline.list()
  });

  const upcomingDeadlines = taxDeadlines.filter(d => {
    const deadlineDate = new Date(d.deadline_date);
    const today = new Date();
    return deadlineDate > today;
  }).slice(0, 3);

  const features = [
    {
      title: 'Steuererklärung',
      icon: FileText,
      description: 'Formulare ausfüllen',
      path: 'TaxManagement',
      color: 'bg-blue-600'
    },
    {
      title: 'ELSTER',
      icon: CheckCircle,
      description: 'Elektronische Übermittlung',
      path: 'ElsterIntegration',
      color: 'bg-green-600'
    },
    {
      title: 'Kalkulator',
      icon: Calculator,
      description: 'Steuer berechnen',
      path: 'TaxDashboard',
      color: 'bg-purple-600'
    },
    {
      title: 'Fristen',
      icon: Calendar,
      description: 'Termine überwachen',
      path: 'TaxDeadlines',
      color: 'bg-orange-600'
    },
    {
      title: 'Optimierung',
      icon: TrendingUp,
      description: 'Steuer sparen',
      path: 'TaxOptimizationStrategy',
      color: 'bg-indigo-600'
    },
    {
      title: 'Belege',
      icon: FileText,
      description: 'Dokumente verwalten',
      path: 'TaxDocumentManager',
      color: 'bg-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Calculator className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Steuerverwaltung</h1>
          <p className="text-slate-600">Ihre digitale Steuerlösung für Deutschland, Österreich & Schweiz</p>
        </div>

        {upcomingDeadlines.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-5 h-5" />
                Anstehende Fristen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{deadline.description}</p>
                      <p className="text-sm text-slate-600">{deadline.tax_type}</p>
                    </div>
                    <p className="text-sm font-semibold text-orange-600">
                      {new Date(deadline.deadline_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">Formulare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{taxForms.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">Offene Fristen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">{upcomingDeadlines.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Aktuell
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={createPageUrl(feature.path)}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 ${feature.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Formulare</CardTitle>
          </CardHeader>
          <CardContent>
            {taxForms.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Noch keine Formulare erstellt</p>
            ) : (
              <div className="space-y-2">
                {taxForms.slice(0, 5).map((form) => (
                  <div key={form.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{form.form_name}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(form.created_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {form.status || 'In Bearbeitung'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}