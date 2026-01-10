import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send } from 'lucide-react';

export default function EmailTemplates() {
  const templates = [
    { id: 1, name: 'Mieterinnerung', subject: 'Erinnerung Mietzahlung' },
    { id: 2, name: 'Wartungsankündigung', subject: 'Wartungsarbeiten' },
    { id: 3, name: 'Vertragsende', subject: 'Vertragsende Erinnerung' },
    { id: 4, name: 'Willkommen', subject: 'Willkommen im Haus' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email-Vorlagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map(template => (
          <div key={template.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div className="flex-1">
              <p className="text-sm font-semibold">{template.name}</p>
              <p className="text-xs text-slate-600">{template.subject}</p>
            </div>
            <Button size="sm" variant="outline">
              <Send className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}