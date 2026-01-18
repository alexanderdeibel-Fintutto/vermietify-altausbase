import React from 'react';

export default function VermitifyAGB() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>

        <div className="space-y-8 text-[var(--vf-neutral-700)]">
          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 1 Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der 
              Vermitify GmbH (nachfolgend "Anbieter") und dem Kunden über die Nutzung der 
              Software-as-a-Service-Plattform "Vermitify".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 2 Vertragsgegenstand</h2>
            <p>
              Der Anbieter stellt dem Kunden eine cloudbasierte Software zur Immobilienverwaltung 
              zur Verfügung. Der Funktionsumfang richtet sich nach dem gewählten Tarif.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 3 Vertragsschluss</h2>
            <p>
              Der Vertrag kommt durch die Registrierung des Kunden und die anschließende Bestätigung 
              durch den Anbieter zustande. Bei kostenpflichtigen Tarifen erfolgt der Vertragsschluss 
              mit dem Abschluss des Bestellvorgangs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 4 Leistungsumfang</h2>
            <p className="mb-4">
              Der Anbieter stellt die Software über das Internet zur Verfügung. Die Verfügbarkeit 
              beträgt 99% im Jahresdurchschnitt, ausgenommen geplante Wartungsarbeiten.
            </p>
            <p>
              Der Anbieter behält sich vor, die Software weiterzuentwickeln und Funktionen zu ändern, 
              sofern dies dem Kunden zumutbar ist.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 5 Preise und Zahlung</h2>
            <p>
              Die aktuellen Preise sind auf der Preisseite einsehbar. Die Abrechnung erfolgt monatlich 
              oder jährlich im Voraus per Kreditkarte oder SEPA-Lastschrift.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 6 Testphase</h2>
            <p>
              Neukunden erhalten eine 14-tägige kostenlose Testphase. Nach Ablauf der Testphase ist 
              die Buchung eines kostenpflichtigen Tarifs erforderlich.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 7 Kündigung</h2>
            <p>
              Der Vertrag kann von beiden Seiten jederzeit mit einer Frist von 30 Tagen zum Monatsende 
              gekündigt werden. Die Kündigung bedarf der Textform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 8 Datenschutz und Datensicherheit</h2>
            <p>
              Der Anbieter verpflichtet sich, alle geltenden Datenschutzbestimmungen einzuhalten. 
              Details regelt die separate Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 9 Haftung</h2>
            <p>
              Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Bei leichter 
              Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 10 Schlussbestimmungen</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. 
              Gerichtsstand ist Berlin.
            </p>
          </section>

          <div className="pt-8 border-t border-[var(--vf-neutral-200)]">
            <p className="text-sm text-[var(--vf-neutral-500)]">
              Stand: Januar 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}