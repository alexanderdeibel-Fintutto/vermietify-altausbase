import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Eye, Download, Trash2 } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function TaxFormsPage() {
  const forms = [
    { id: 1, name: 'Anlage V 2025', year: 2025, building: 'Gebäude A', status: 'completed', dueDate: '2026-05-31' },
    { id: 2, name: 'Anlage V 2024', year: 2024, building: 'Gebäude A', status: 'submitted', dueDate: '2025-05-31' },
    { id: 3, name: 'Euer 2025', year: 2025, building: 'Gebäude B', status: 'draft', dueDate: '2026-06-30' },
    { id: 4, name: 'Gewerbesteuer 2025', year: 2025, building: 'Gebäude A', status: 'pending', dueDate: '2026-05-15' },
  ];

  const stats = [
    { label: 'Gesamtformulare', value: forms.length },
    { label: 'Abgeschlossen', value: forms.filter(f => f.status === 'completed').length },
    { label: 'Eingereicht', value: forms.filter(f => f.status === 'submitted').length },
    { label: 'Ausstehend', value: forms.filter(f => f.status === 'pending' || f.status === 'draft').length },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-600';
      case 'submitted': return 'bg-blue-600';
      case 'pending': return 'bg-orange-600';
      case 'draft': return 'bg-slate-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed': return 'Abgeschlossen';
      case 'submitted': return 'Eingereicht';
      case 'pending': return 'Ausstehend';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📋 Steuerformulare</h1>
          <p className="text-slate-600 mt-1">Verwalten und bearbeiten Sie Steuerformulare</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-2" />Neues Formular</Button>
      </div>

      <QuickStats stats={stats} accentColor="orange" />

      <div className="space-y-3">
        {forms.map((form) => (
          <Card key={form.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{form.name}</h3>
                    <Badge className={getStatusColor(form.status)}>{getStatusLabel(form.status)}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{form.building} • Jahr: {form.year}</p>
                  <p className="text-xs text-slate-500 mt-1">Fällig: {form.dueDate}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost"><Eye className="w-4 h-4 text-blue-600" /></Button>
                  <Button size="icon" variant="ghost"><Download className="w-4 h-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}