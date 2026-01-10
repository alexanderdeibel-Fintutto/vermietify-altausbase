import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, Plus, Upload, FileText, Users } from 'lucide-react';

export default function QuickActionsMenu() {
  const actions = [
    { icon: Plus, label: 'Gebäude hinzufügen', page: 'Buildings' },
    { icon: Users, label: 'Mieter anlegen', page: 'Tenants' },
    { icon: Upload, label: 'Dokument hochladen', page: 'Documents' },
    { icon: FileText, label: 'Rechnung erfassen', page: 'Invoices' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Schnellaktionen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, idx) => (
            <Link key={idx} to={createPageUrl(action.page)}>
              <Button variant="outline" className="w-full h-20 flex-col">
                <action.icon className="w-5 h-5 mb-2" />
                <span className="text-xs">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}