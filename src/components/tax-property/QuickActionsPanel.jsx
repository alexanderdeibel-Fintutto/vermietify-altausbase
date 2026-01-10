import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FileText, 
  Receipt, 
  Building2, 
  TrendingUp,
  Calculator,
  Upload
} from 'lucide-react';

export default function QuickActionsPanel() {
  const actions = [
    { icon: FileText, label: 'Anlage V', href: 'AnlageVGDE', color: 'blue' },
    { icon: Receipt, label: 'Beleg scannen', href: 'SteuerVermoegenApp', color: 'green' },
    { icon: Building2, label: 'Objekt hinzufügen', href: 'Buildings', color: 'purple' },
    { icon: TrendingUp, label: 'Portfolio', href: 'WealthManagement', color: 'indigo' },
    { icon: Calculator, label: 'Steuerrechner', href: 'SteuerVermoegenApp', color: 'orange' },
    { icon: Upload, label: 'Import', href: 'SteuerVermoegenApp', color: 'pink' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schnellzugriff</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={createPageUrl(action.href)}>
                <Button variant="outline" className="w-full h-24 flex-col gap-2">
                  <Icon className={`w-6 h-6 text-${action.color}-600`} />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}