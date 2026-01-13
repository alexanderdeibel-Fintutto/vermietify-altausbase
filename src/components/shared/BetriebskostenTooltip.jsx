import React from 'react';
import HelpTooltip from '@/components/shared/HelpTooltip';

export default function BetriebskostenTooltip() {
  return (
    <HelpTooltip text="Nur Kosten mit Status 'Umlagefähig' werden in der BK-Abrechnung berücksichtigt. Fehlende Kosten? Prüfe die Kategorisierung deiner Rechnungen und den Umlagefähig-Status." />
  );
}