import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calculator, FileText, Users, Building2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActionsMenu() {
  const actions = [
    { icon: Building2, label: 'Objekt', href: 'Buildings' },
    { icon: Users, label: 'Mieter', href: 'Tenants' },
    { icon: FileText, label: 'Vertrag', href: 'Contracts' },
    { icon: Calculator, label: 'Rechner', href: 'VermitifyToolsOverview' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const ActionIcon = action.icon;
        return (
          <Link key={action.label} to={createPageUrl(action.href)}>
            <Button variant="outline" size="sm">
              <ActionIcon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}