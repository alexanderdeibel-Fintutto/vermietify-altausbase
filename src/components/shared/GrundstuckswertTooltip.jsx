import HelpTooltip from './HelpTooltip';

export default function GrundstuckswertTooltip({ children }) {
  return (
    <HelpTooltip 
      text="Grundstückswert: Nicht abschreibbarer Anteil des Kaufpreises. Typisch 20-30%. Ohne korrekte Trennung: falsche AfA-Berechnung! Beratung: Steuerberater."
    >
      {children}
    </HelpTooltip>
  );
}