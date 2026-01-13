import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportBuilder from '@/components/reporting/ReportBuilder';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ReportingHub() {
  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report?.list?.('-generated_at', 20) || []
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reporting</h1>
        <p className="text-slate-600 text-sm mt-1">Custom Reports, Planung, Export</p>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">🔨 Builder</TabsTrigger>
          <TabsTrigger value="history">📊 Verlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Neuer Report</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-2">
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{report.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{report.type} • {report.format}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(report.generated_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}