import { Badge } from "@/components/ui/badge";
import HelpTooltip from "@/components/shared/HelpTooltip";

export default function UmlagefaehigBadge({ status = 'full' }) {
  const config = {
    full: {
      label: '🟢 Umlagefähig (BetrKV)',
      tooltip: 'Diese Kosten können an Mieter weitergegeben werden (§556 BGB). Beispiele: Müllabfuhr, Hausmeister, Gartenpflege.',
      color: 'bg-green-100 text-green-800 border-green-300'
    },
    partial: {
      label: '🟡 Teilweise umlagefähig',
      tooltip: 'Nur ein Teil dieser Kosten darf umgelegt werden. Beispiel: Reparaturen (nur Verbrauch, nicht Instandhaltung).',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    none: {
      label: '🔴 Nicht umlagefähig',
      tooltip: 'Diese Kosten können nicht an Mieter weitergegeben werden. Beispiele: Verwaltungskosten, Maklergebühren.',
      color: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  const cfg = config[status] || config.full;

  return (
    <div className="flex items-center gap-1">
      <Badge className={`border ${cfg.color}`}>
        {cfg.label}
      </Badge>
      <HelpTooltip text={cfg.tooltip} />
    </div>
  );
}