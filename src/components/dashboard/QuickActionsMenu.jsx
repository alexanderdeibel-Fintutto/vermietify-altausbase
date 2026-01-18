import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, Building, Users, FileText, Receipt } from 'lucide-react';

export default function QuickActionsMenu() {
  const actions = [
    { icon: Building, label: 'Neues Objekt', onClick: () => {} },
    { icon: Users, label: 'Neuer Mieter', onClick: () => {} },
    { icon: FileText, label: 'Neuer Vertrag', onClick: () => {} },
    { icon: Receipt, label: 'Neue Rechnung', onClick: () => {} }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="gradient">
          <Plus className="h-5 w-5 mr-2" />
          Neu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => (
          <DropdownMenuItem key={index} onClick={action.onClick}>
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}