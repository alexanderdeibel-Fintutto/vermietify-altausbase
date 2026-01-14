import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BuchungenGenerierenTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-slate-400 cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Was bedeutet "Buchungen generieren"?</p>
            <p className="text-sm">
              Erstellt automatische <strong>SOLL-Buchungen</strong> basierend auf dem Vertrag 
              (geplante Mieteinnahmen, Nebenkosten-Vorauszahlungen).
            </p>
            <p className="text-sm text-blue-600 font-medium">
              💡 Diese müssen mit tatsächlichen Bank-Zahlungen (IST) abgeglichen werden.
            </p>
            <div className="text-xs text-slate-500 mt-2">
              Ohne SOLL-Buchungen: Mieteinnahmen fehlen in der Anlage V!
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}