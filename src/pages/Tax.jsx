import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function TaxPage() {
  const taxDeadlines = [
    { form: 'Anlage V', dueDate: '2026-05-31', status: 'in_progress', completeness: 85 },
    { form: 'Euer', dueDate: '2026-06-30', status: 'pending', completeness: 20 },
    { form: 'Gewerbesteuer', dueDate: '2026-05-15', status: 'pending', completeness: 0 },
  ];

  const stats = [
    { label: 'Steuerformulare', value: taxDeadlines.length },
    { label: 'Abgeschlossen', value: 1 },
    { label: 'In Bearbeitung', value: 1 },
    { label: 'Tage bis Deadline', value: 144 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏦 Steuern</h1>
        <p className="text-slate-600 mt-1">Steuerformulare und Compliance</p>
      </div>

      <QuickStats stats={stats} accentColor="orange" />

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="deadlines">Fristen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          {taxDeadlines.map((deadline, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-slate-900">{deadline.form}</h3>
                      <Badge className={deadline.status === 'in_progress' ? 'bg-blue-600' : deadline.status === 'pending' ? 'bg-orange-600' : 'bg-green-600'}>
                        {deadline.status === 'in_progress' ? 'In Bearbeitung' : deadline.status === 'pending' ? 'Ausstehend' : 'Abgeschlossen'}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-600 flex items-center gap-1"><Calendar className="w-4 h-4" /> {deadline.dueDate}</span>
                  </div>
                  <div className="ml-8">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Fortschritt</span>
                      <span className="font-semibold">{deadline.completeness}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${deadline.completeness}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="deadlines">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Wichtige Fristen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { date: '31.05.2026', item: 'Anlage V Einreichung' },
                { date: '30.06.2026', item: 'Euer Einreichung' },
                { date: '15.05.2026', item: 'Gewerbesteuer Zahlung' },
              ].map((deadline, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{deadline.item}</p>
                    <p className="text-sm text-slate-600">{deadline.date}</p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Erforderliche Dokumente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Finanzbuchungen', 'Mieteinnahmen', 'Betriebskosten', 'Reparaturen', 'Versicherungen'].map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-900">{doc}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}