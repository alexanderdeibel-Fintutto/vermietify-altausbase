import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Plus, Save } from 'lucide-react';

export default function AdvancedReportBuilderPage() {
  const [reportName, setReportName] = useState('Eigener Report');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'expenses']);

  const metrics = {
    financial: ['Einnahmen', 'Ausgaben', 'Nettowert', 'Cashflow', 'Gewinnmarge'],
    occupancy: ['Belegungsquote', 'Leerstände', 'Fluktuationsrate', 'Durchschn. Mietdauer'],
    compliance: ['Inspektionen', 'Violations', 'Audit-Status', 'Compliance-Score'],
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📊 Report Builder</h1>
          <p className="text-slate-600 mt-1">Erstellen Sie benutzerdefinierte Reports</p>
        </div>
        <Button className="bg-lime-600 hover:bg-lime-700"><Save className="w-4 h-4 mr-2" />Speichern</Button>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metriken</TabsTrigger>
          <TabsTrigger value="filter">Filter</TabsTrigger>
          <TabsTrigger value="format">Format</TabsTrigger>
          <TabsTrigger value="preview">Vorschau</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {Object.entries(metrics).map(([category, items]) => (
            <Card key={category} className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">{category.charAt(0).toUpperCase() + category.slice(1)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox checked={selectedMetrics.includes(item)} onCheckedChange={() => toggleMetric(item)} />
                    <label className="text-sm text-slate-700 flex-1 cursor-pointer">{item}</label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="filter">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Report-Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Zeitraum', 'Gebäude', 'Kategorie', 'Status'].map((filter, idx) => (
                <div key={idx} className="p-2 border border-slate-200 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900">{filter}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="format">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Export-Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['PDF', 'Excel', 'CSV', 'JSON'].map((fmt, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                  <input type="radio" name="format" defaultChecked={fmt === 'PDF'} />
                  <label className="text-sm text-slate-700 flex-1">{fmt}</label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Vorschau</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 text-center py-8">Report-Vorschau wird hier angezeigt</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}