import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Calendar } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxYearClosingChecklist() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [completed, setCompleted] = useState({});

  const { data: checklist = {}, isLoading } = useQuery({
    queryKey: ['taxClosingChecklist', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxYearClosingChecklist', {
        country,
        taxYear
      });
      return response.data?.checklist || {};
    }
  });

  const toggleItem = (sectionIdx, itemIdx) => {
    const key = `${sectionIdx}-${itemIdx}`;
    setCompleted(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sections = checklist.sections || [];
  const totalItems = sections.reduce((sum, s) => sum + (s.items?.length || 0), 0);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? (completedCount / totalItems * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Jahresabschluss-Checkliste</h1>
        <p className="text-slate-500 mt-1">Bereiten Sie Ihren Jahresabschluss systematisch vor</p>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Checkliste wird erstellt...</div>
      ) : (
        <>
          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Fortschritt</span>
                <span className="text-sm font-bold">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">{completedCount} von {totalItems} abgeschlossen</p>
            </CardContent>
          </Card>

          {/* Critical Items */}
          {(checklist.critical_items || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  🔴 Kritische Punkte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.critical_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {sections.map((section, sectionIdx) => (
            <Card key={sectionIdx}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{section.section_name}</CardTitle>
                    {section.deadline && (
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Deadline: {section.deadline}
                      </p>
                    )}
                  </div>
                  {section.priority && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      section.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      section.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {section.priority}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(section.items || []).map((item, itemIdx) => {
                    const key = `${sectionIdx}-${itemIdx}`;
                    const isCompleted = completed[key];
                    return (
                      <label key={key} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleItem(sectionIdx, itemIdx)}
                          className="mt-1"
                        />
                        <span className={`text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Timeline */}
          {checklist.timeline && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Zeitplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(checklist.timeline).map(([period, tasks]) => (
                  <div key={period} className="border-l-4 border-blue-300 pl-3">
                    <p className="font-bold text-sm">{period}</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      {tasks.map((task, i) => (
                        <li key={i}>• {task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}