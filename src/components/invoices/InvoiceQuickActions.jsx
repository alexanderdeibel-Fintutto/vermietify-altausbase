import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import ContextHelp from '@/components/shared/ContextHelp';

export default function InvoiceQuickActions({ onNewInvoice, onSmartInvoice }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex items-center gap-2">
        <Button 
          onClick={onNewInvoice}
          className="bg-slate-700 hover:bg-slate-800 gap-2 font-extralight text-sm sm:text-base flex-1 sm:flex-none"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Neue Rechnung</span>
          <span className="sm:hidden">Neu</span>
          <span className="text-xs ml-1 opacity-50">(Ctrl+N)</span>
        </Button>
        <ContextHelp text="Erstelle eine neue Rechnung. Shortcut: Ctrl+N" />
      </div>

      <div className="flex items-center gap-2">
        <Button 
          onClick={onSmartInvoice}
          className="bg-blue-600 hover:bg-blue-700 gap-2 font-extralight text-sm sm:text-base flex-1 sm:flex-none"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Smart-Erfassung</span>
          <span className="sm:hidden">Smart</span>
        </Button>
        <ContextHelp text="Intelligente Erfassung mit AI-Unterstützung" />
      </div>
    </div>
  );
}