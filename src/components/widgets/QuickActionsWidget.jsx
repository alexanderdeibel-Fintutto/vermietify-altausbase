import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Building2, Users, FileText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions = [
    { icon: Building2, label: 'Neues Objekt', page: 'Buildings', color: 'primary' },
    { icon: Users, label: 'Neuer Mieter', page: 'Tenants', color: 'accent' },
    { icon: FileText, label: 'Neuer Vertrag', page: 'Contracts', color: 'success' },
    { icon: Upload, label: 'Dokument hochladen', page: 'Documents', color: 'info' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Schnellaktionen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate(createPageUrl(action.page))}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}