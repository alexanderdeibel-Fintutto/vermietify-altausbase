import HelpTooltip from './HelpTooltip';

export default function BetriebskostenTooltip({ children }) {
  return (
    <HelpTooltip 
      text="Betriebskostenabrechnung: Jährliche Abrechnung von umlagefähigen Nebenkosten mit Mietern nach §556 BGB und BetrKV. Automatisch auf m² der Wohneinheit verteilt."
    >
      {children}
    </HelpTooltip>
  );
}