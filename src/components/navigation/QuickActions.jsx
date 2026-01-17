import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Neu erstellen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate(createPageUrl('Buildings'))}>
          🏢 Neues Objekt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(createPageUrl('Tenants'))}>
          👤 Neuer Mieter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(createPageUrl('Contracts'))}>
          📄 Neuer Vertrag
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(createPageUrl('Invoices'))}>
          🧾 Neue Rechnung
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(createPageUrl('Documents'))}>
          📁 Neues Dokument
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}