import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, FileText, Receipt } from 'lucide-react';

export default function QuickActionsWidget() {
  const actions = [
    { icon: Building, label: 'Objekt', color: 'bg-blue-500' },
    { icon: Users, label: 'Mieter', color: 'bg-green-500' },
    { icon: FileText, label: 'Vertrag', color: 'bg-purple-500' },
    { icon: Receipt, label: 'Beleg', color: 'bg-orange-500' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="vf-quick-actions">
          {actions.map((action, index) => (
            <button key={index} className="vf-quick-action">
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}