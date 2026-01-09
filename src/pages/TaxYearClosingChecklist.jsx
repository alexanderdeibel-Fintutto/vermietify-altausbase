import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxYearClosingChecklist() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [checkedItems, setCheckedItems] = useState(new Set());

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

  const toggleCheck = (id) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const completionPercentage = (checkedItems.size / Math.max(1, 
    (checklist.checklist?.critical_tasks?.length || 0) +
    (checklist.checklist?.documentation?.length || 0) +
    (checklist.checklist?.filings?.length || 0)
  )) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">✅ Tax Year Closing Checklist</h1>
        <p className="text-slate-500 mt-1">Systematisches Abschließen Ihres Steuerjahres</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <SelectItem value={String(CURRENT_YEAR - 2)}>{CURRENT_YEAR - 2}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Fortschritt</label>
          <div className="mt-2 text-2xl font-bold text-blue-600">{Math.round(completionPercentage)}%</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Checkliste...</div>
      ) : (
        <>
          {/* Critical Tasks */}
          {(checklist.checklist?.critical_tasks || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Kritische Aufgaben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.checklist.critical_tasks.map((task, i) => {
                  const itemId = `critical-${i}`;
                  return (
                    <label key={itemId} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                      <Checkbox
                        checked={checkedItems.has(itemId)}
                        onCheckedChange={() => toggleCheck(itemId)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title || task.task}</p>
                        {task.deadline && (
                          <p className="text-xs text-slate-600 mt-0.5">Deadline: {task.deadline}</p>
                        )}
                      </div>
                      {task.priority && (
                        <Badge className="flex-shrink-0 bg-red-200 text-red-800 text-xs">
                          {task.priority.toUpperCase()}
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Documentation */}
          {(checklist.checklist?.documentation || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Dokumentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.checklist.documentation.map((doc, i) => {
                  const itemId = `doc-${i}`;
                  return (
                    <label key={itemId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <Checkbox
                        checked={checkedItems.has(itemId)}
                        onCheckedChange={() => toggleCheck(itemId)}
                      />
                      <span className="text-sm">{doc}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Filings */}
          {(checklist.checklist?.filings || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📄 Anträge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.checklist.filings.map((filing, i) => {
                  const itemId = `filing-${i}`;
                  return (
                    <label key={itemId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <Checkbox
                        checked={checkedItems.has(itemId)}
                        onCheckedChange={() => toggleCheck(itemId)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{filing.name || filing.title}</p>
                        {filing.deadline && (
                          <p className="text-xs text-slate-600 mt-0.5">Fällig: {filing.deadline}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {(checklist.checklist?.reviews || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Überprüfungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.checklist.reviews.map((review, i) => {
                  const itemId = `review-${i}`;
                  return (
                    <label key={itemId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <Checkbox
                        checked={checkedItems.has(itemId)}
                        onCheckedChange={() => toggleCheck(itemId)}
                      />
                      <span className="text-sm">{review}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {checklist.checklist?.timeline && (
            <Card className="bg-blue-50 border-blue-300">
              <CardHeader>
                <CardTitle className="text-sm">📅 Zeitplan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                {checklist.checklist.timeline}
              </CardContent>
            </Card>
          )}

          {/* Completion Info */}
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Fortschritt</p>
                  <p className="text-sm text-green-800 mt-1">
                    {checkedItems.size} von {
                      (checklist.checklist?.critical_tasks?.length || 0) +
                      (checklist.checklist?.documentation?.length || 0) +
                      (checklist.checklist?.filings?.length || 0)
                    } Aufgaben erledigt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}