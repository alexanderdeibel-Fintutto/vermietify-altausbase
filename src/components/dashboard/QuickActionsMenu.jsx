import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Zap, Plus, FileText, Upload, Calculator } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function QuickActionsMenu() {
  const actions = [
    { icon: Plus, label: 'Neue Transaktion', href: createPageUrl('FinancialItems') },
    { icon: FileText, label: 'Dokument hochladen', href: createPageUrl('DocumentManagementCenter') },
    { icon: Upload, label: 'Beleg scannen', action: () => {} },
    { icon: Calculator, label: 'Steuer berechnen', href: createPageUrl('SteuerVermoegenApp') }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-blue-600">
          <Zap className="w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <p className="font-semibold text-sm mb-3">Schnellaktionen</p>
          {actions.map((action, idx) => (
            action.href ? (
              <Link key={idx} to={action.href} className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button key={idx} variant="ghost" className="w-full justify-start" onClick={action.action}>
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            )
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}