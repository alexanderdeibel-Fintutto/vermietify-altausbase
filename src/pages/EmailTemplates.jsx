import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Edit2, Trash2, Eye } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function EmailTemplatesPage() {
  const templates = [
    { id: 1, name: 'Zahlungserinnerung', subject: 'Zahlung fällig am {{due_date}}', category: 'payment', usage: 1240 },
    { id: 2, name: 'Mietvertrag Verlängerung', subject: 'Ihr Mietvertrag läuft aus', category: 'contract', usage: 156 },
    { id: 3, name: 'Mieter Willkommen', subject: 'Willkommen bei {{property_name}}', category: 'onboarding', usage: 89 },
    { id: 4, name: 'Wartungsmitteilung', subject: 'Geplante Wartung am {{date}}', category: 'maintenance', usage: 234 },
    { id: 5, name: 'Dokument erforderlich', subject: 'Bitte laden Sie {{document_name}} hoch', category: 'document', usage: 567 },
  ];

  const stats = [
    { label: 'Gesamt Templates', value: templates.length },
    { label: 'Kategories', value: 5 },
    { label: 'Verwendungen (Monat)', value: templates.reduce((sum, t) => sum + t.usage, 0).toLocaleString('de-DE') },
    { label: 'Zuletzt aktualisiert', value: 'Vor 2 Tg.' },
  ];

  const getCategoryColor = (category) => {
    const colors = {
      payment: 'bg-green-100 text-green-800',
      contract: 'bg-blue-100 text-blue-800',
      onboarding: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-orange-100 text-orange-800',
      document: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📧 Email Templates</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie E-Mail-Vorlagen für automatische Benachrichtigungen</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Neues Template</Button>
      </div>

      <QuickStats stats={stats} accentColor="green" />

      <div className="space-y-3">
        {templates.map((template) => (
          <Card key={template.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">Betreff: {template.subject}</p>
                  <p className="text-xs text-slate-500 mt-2">📊 {template.usage.toLocaleString('de-DE')} Verwendungen</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost"><Eye className="w-4 h-4 text-slate-600" /></Button>
                  <Button size="icon" variant="ghost"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
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