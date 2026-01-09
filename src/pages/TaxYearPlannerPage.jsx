import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxYearPlannerPage() {
  const [country, setCountry] = useState('DE');
  const [planYear, setPlanYear] = useState(CURRENT_YEAR + 1);

  const { data: plan = {}, isLoading } = useQuery({
    queryKey: ['taxYearPlan', country, planYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxYearPlan', {
        country,
        upcomingTaxYear: planYear
      });
      return response.data || {};
    }
  });

  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Steuer-Jahresplan</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre Steuererklärung für das gesamte Jahr</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(planYear)} onValueChange={(v) => setPlanYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR + 1, CURRENT_YEAR + 2].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Plan wird erstellt...</div>
      ) : (
        <>
          {/* Tax Saving Tips */}
          {(plan.tax_saving_tips || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Steuerspar-Tipps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.tax_saving_tips.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Deadlines */}
          {(plan.key_deadlines || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  📍 Wichtige Termine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.key_deadlines.map((deadline, i) => (
                  <div key={i} className="border-l-4 border-red-300 pl-3 py-2">
                    <p className="font-bold text-sm">{deadline.date}</p>
                    <p className="text-xs text-slate-600">{deadline.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Monthly Checklist */}
          {plan.monthly_checklist && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Monatliche Checkliste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {months.map((month, monthIdx) => {
                    const monthlyItems = plan.monthly_checklist[month] || [];
                    return (
                      <div key={monthIdx} className="border rounded-lg p-3">
                        <p className="font-bold text-sm mb-2">{month}</p>
                        <div className="space-y-1">
                          {monthlyItems.map((item, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="text-blue-600">→</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentation */}
          {(plan.documentation_needed || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📄 Erforderliche Dokumentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.documentation_needed.map((doc, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    {doc}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quarterly Plan */}
          {(plan.quarterly_plan || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Quartalsübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {plan.quarterly_plan.map((quarter, i) => (
                    <div key={i} className="border rounded-lg p-3 bg-blue-50">
                      <p className="font-bold text-sm mb-2">{quarter.quarter}</p>
                      <div className="space-y-1 text-xs">
                        {(quarter.tasks || []).map((task, j) => (
                          <p key={j}>• {task}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}