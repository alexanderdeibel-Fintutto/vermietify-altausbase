import HelpTooltip from './HelpTooltip';

export default function UmlagefaehigTooltip({ children }) {
  return (
    <HelpTooltip 
      text="Umlagefähig: Kosten, die Sie an Mieter weitergeben können. Bsp: Müllabfuhr, Hausmeister, Wasser, Abwasser. NICHT umlagefähig: Reparaturen, Verwaltungskosten, AfA."
    >
      {children}
    </HelpTooltip>
  );
}