import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function UmlagefaehigBadge({ type = 'umlagefaehig' }) {
  const configs = {
    umlagefaehig: {
      label: '🟢 Umlagefähig',
      tooltip: 'Diese Kosten können an Mieter weitergegeben werden (§556 BGB, BetrKV). Beispiele: Müllabfuhr, Hausmeister, Gärtner.',
      className: 'bg-green-100 text-green-800'
    },
    nicht_umlagefaehig: {
      label: '🔴 Nicht umlagefähig',
      tooltip: 'Diese Kosten können NICHT an Mieter weitergegeben werden. Beispiele: Verwaltungskosten, Reparaturen, Instandhaltung.',
      className: 'bg-red-100 text-red-800'
    },
    teilweise_umlagefaehig: {
      label: '🟡 Teilweise umlagefähig',
      tooltip: 'Nur ein Teil dieser Kosten kann umgelegt werden. Manuell anteilig aufteilen.',
      className: 'bg-amber-100 text-amber-800'
    }
  };

  const config = configs[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={config.className} variant="secondary">
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}