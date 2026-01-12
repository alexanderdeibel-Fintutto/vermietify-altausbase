import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['anlageKAP', selectedYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAnlageKAP', { tax_year: selectedYear });
      return response.data;
    }
  });

  const years = [2024, 2025, 2026];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Berechne Steuer-Report...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Steuer-Report (Anlage KAP)</h1>
          <p className="text-slate-600 mt-1">Kapitalerträge für Steuererklärung</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.info('PDF-Export in Entwicklung')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Kapitalerträge */}
      <Card>
        <CardHeader>
          <CardTitle>Kapitalerträge Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-sm text-emerald-700">Dividenden/Zinsen</p>
              <p className="text-2xl font-bold text-emerald-900">
                {(reportData?.dividends?.total || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-emerald-600 mt-1">{reportData?.dividends?.count || 0} Zahlungen</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">Kursgewinne</p>
              <p className="text-2xl font-bold text-blue-900">
                {(reportData?.capital_gains?.total || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-blue-600 mt-1">{reportData?.capital_gains?.count || 0} Verkäufe</p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-900">Gesamt-Einkünfte</span>
              <span className="text-2xl font-bold text-purple-900">
                {(reportData?.summary?.total_income || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freistellungsauftrag */}
      <Card>
        <CardHeader>
          <CardTitle>Freistellungsauftrag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Gesamtsumme</span>
              <span className="font-medium">{(reportData?.freistellungsauftrag?.total || 1602).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Genutzt</span>
              <span className="font-medium text-red-600">{(reportData?.freistellungsauftrag?.used || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Noch verfügbar</span>
              <span className="font-bold text-emerald-600">{(reportData?.freistellungsauftrag?.available || 1602).toFixed(2)}€</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
              <div 
                className="bg-emerald-600 h-3 rounded-full transition-all" 
                style={{ width: `${Math.min(100, ((reportData?.freistellungsauftrag?.used || 0) / (reportData?.freistellungsauftrag?.total || 1602)) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verlustverrechnungstöpfe */}
      <Card>
        <CardHeader>
          <CardTitle>Verlustverrechnungstöpfe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700">Aktien-Verluste</p>
              <p className="text-xl font-bold text-red-900">
                {(reportData?.loss_pots?.stock || 0).toFixed(2)}€
              </p>
              <p className="text-xs text-red-600 mt-1">Nur mit Aktien-Gewinnen verrechenbar</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700">Sonstige Verluste</p>
              <p className="text-xl font-bold text-orange-900">
                {(reportData?.loss_pots?.other || 0).toFixed(2)}€
              </p>
              <p className="text-xs text-orange-600 mt-1">Mit allen Kapitalerträgen verrechenbar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steuerberechnung */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle>Steuerberechnung {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Einkünfte gesamt</span>
            <span className="font-medium">{(reportData?.summary?.total_income || 0).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>./. Freistellungsauftrag</span>
            <span className="font-medium text-emerald-600">- {(reportData?.freistellungsauftrag?.used || 0).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-medium">Zu versteuernde Einkünfte</span>
            <span className="font-bold">{(reportData?.summary?.taxable_income || 0).toFixed(2)}€</span>
          </div>
          
          <div className="bg-white p-4 rounded-lg space-y-2 border-l-4 border-red-600">
            <div className="flex justify-between text-sm">
              <span>Kapitalertragsteuer (25%)</span>
              <span className="font-medium">{(reportData?.summary?.kapitalertragsteuer || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Solidaritätszuschlag (5,5%)</span>
              <span className="font-medium">{(reportData?.summary?.solidaritaetszuschlag || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Gesamtsteuer</span>
              <span className="font-bold text-red-600 text-lg">
                {(reportData?.summary?.total_tax || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}