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
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxYearClosingChecklist() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [checkedItems, setCheckedItems] = useState(new Set());

  const { data: checklist = {}, isLoading } = useQuery({
    queryKey: ['closingChecklist', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxYearClosingChecklist', {
        country,
        taxYear
      });
      return response.data?.checklist || {};
    }
  });

  const toggleCheck = (item) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setCheckedItems(newSet);
  };

  const allItems = [
    ...(checklist.items?.critical_tasks || []).map(t => t.task || t),
    ...(checklist.items?.documentation || []),
    ...(checklist.items?.filings || []),
    ...(checklist.items?.review_items || [])
  ];

  const progress = allItems.length > 0 ? Math.round((checkedItems.size / allItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Tax Year Closing Checklist</h1>
        <p className="text-slate-500 mt-1">Schließen Sie Ihr Steuerjahr ab</p>
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
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Checkliste wird erstellt...</div>
      ) : (
        <>
          {/* Progress */}
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Fortschritt</span>
                <span className="font-bold text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-slate-600 mt-3">
                {checkedItems.size} von {allItems.length} Aufgaben abgeschlossen
              </p>
            </CardContent>
          </Card>

          {/* Critical Tasks */}
          {(checklist.items?.critical_tasks || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Kritische Aufgaben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.items.critical_tasks.map((task, i) => {
                  const taskKey = task.task || task;
                  const isChecked = checkedItems.has(taskKey);
                  return (
                    <div key={i} className="flex gap-3 p-3 bg-white rounded items-start">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleCheck(taskKey)}
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isChecked ? 'line-through text-slate-500' : ''}`}>
                          {taskKey}
                        </p>
                        {task.deadline && <p className="text-xs text-red-600 mt-1">Fällig: {task.deadline}</p>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Documentation */}
          {(checklist.items?.documentation || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📄 Dokumentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.items.documentation.map((doc, i) => {
                  const isChecked = checkedItems.has(doc);
                  return (
                    <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded items-start">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleCheck(doc)}
                      />
                      <p className={`text-sm ${isChecked ? 'line-through text-slate-500' : ''}`}>{doc}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Review Items */}
          {(checklist.items?.review_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Überprüfungs-Elemente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.items.review_items.map((item, i) => {
                  const isChecked = checkedItems.has(item);
                  return (
                    <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded items-start">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleCheck(item)}
                      />
                      <p className={`text-sm ${isChecked ? 'line-through text-slate-500' : ''}`}>{item}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Retention Guidelines */}
          {(checklist.items?.retention_guidelines || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Aufbewahrungsrichtlinien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.items.retention_guidelines.map((guideline, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {guideline}
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