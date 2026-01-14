import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BetriebskostenTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-slate-400 cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">Umlagefähige vs. nicht umlagefähige Kosten</p>
            <div className="text-sm space-y-1">
              <p className="text-green-700 font-medium">✓ Umlagefähig (§556 BGB, BetrKV):</p>
              <p className="text-xs">Müllabfuhr, Hausmeister, Grundsteuer, Versicherungen, Gartenpflege, Wasser, Heizung</p>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-red-700 font-medium">✗ Nicht umlagefähig:</p>
              <p className="text-xs">Verwaltungskosten, Reparaturen, Instandhaltung, Bankgebühren, Rechtsberatung</p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Diese Kategorisierung ist für Betriebskostenabrechnungen und Anlage V relevant.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}