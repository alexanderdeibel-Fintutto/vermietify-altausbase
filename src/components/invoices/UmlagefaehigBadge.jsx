import React from 'react';
import { Badge } from '@/components/ui/badge';
import HelpTooltip from '@/components/shared/HelpTooltip';

export default function UmlagefaehigBadge({ umlagefaehig }) {
  if (umlagefaehig === true) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-green-100 text-green-800">🟢 Umlagefähig (BetrKV)</Badge>
        <HelpTooltip text="Diese Kosten können an Mieter weitergegeben werden (§556 BGB). Beispiele: Müllabfuhr, Hausmeister, Straßenreinigung." />
      </div>
    );
  }
  if (umlagefaehig === false) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-red-100 text-red-800">🔴 Nicht umlagefähig</Badge>
        <HelpTooltip text="Diese Kosten können NICHT an Mieter weitergegeben werden. Beispiele: Verwaltungskosten, Reparaturen am Gebäude, Instandhaltung." />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Badge className="bg-amber-100 text-amber-800">🟡 Teilweise umlagefähig</Badge>
      <HelpTooltip text="Ein Teil dieser Kosten kann umlagefähig sein. Bitte in der BK-Abrechnung prüfen und ggf. aufteilen." />
    </div>
  );
}