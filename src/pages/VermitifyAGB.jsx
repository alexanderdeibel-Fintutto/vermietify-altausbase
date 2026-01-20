import React from 'react';

export default function VermitifyAGB() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>

                <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 1 Geltungsbereich</h2>
                        <p>
                            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Software-as-a-Service 
                            (SaaS) Plattform Vermitify, bereitgestellt von der Vermitify GmbH.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 2 Vertragsgegenstand</h2>
                        <p>
                            Vermitify bietet eine cloudbasierte Softwarelösung zur Verwaltung von Immobilien, einschließlich 
                            Mieterverwaltung, Finanzverwaltung, Dokumentenmanagement und steuerlichen Funktionen.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 3 Vertragsschluss</h2>
                        <p>
                            Der Vertrag kommt durch Ihre Registrierung und unsere Bestätigung per E-Mail zustande. 
                            Mit der Registrierung erkennen Sie diese AGB an.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 4 Nutzungsrechte</h2>
                        <p>
                            Sie erhalten ein nicht-exklusives, nicht übertragbares Recht zur Nutzung der Software 
                            während der Laufzeit Ihres Abonnements. Die Software darf nur für eigene Zwecke genutzt werden.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 5 Preise und Zahlung</h2>
                        <p>
                            Die jeweils gültigen Preise sind auf unserer Pricing-Seite einsehbar. Die Abrechnung erfolgt 
                            monatlich oder jährlich im Voraus, je nach gewähltem Abrechnungszyklus.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 6 Kostenlose Testphase</h2>
                        <p>
                            Neue Nutzer erhalten eine 14-tägige kostenlose Testphase. Während dieser Zeit haben Sie 
                            vollen Zugriff auf alle Funktionen Ihres gewählten Plans.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 7 Vertragslaufzeit und Kündigung</h2>
                        <p>
                            Der Vertrag läuft auf unbestimmte Zeit. Er kann von beiden Parteien mit einer Frist von 
                            einem Monat zum Monatsende gekündigt werden. Bei jährlicher Zahlung beträgt die Kündigungsfrist 
                            einen Monat zum Ende der Jahreslaufzeit.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 8 Pflichten des Nutzers</h2>
                        <p>Der Nutzer verpflichtet sich:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Die Software nur rechtmäßig zu nutzen</li>
                            <li>Zugangsdaten vertraulich zu behandeln</li>
                            <li>Keine schädlichen Inhalte hochzuladen</li>
                            <li>Regelmäßig Backups seiner Daten zu erstellen</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 9 Verfügbarkeit und Wartung</h2>
                        <p>
                            Wir streben eine Verfügbarkeit von 99,5% im Jahresmittel an. Geplante Wartungsarbeiten werden 
                            rechtzeitig angekündigt und erfolgen in der Regel nachts.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 10 Datenschutz</h2>
                        <p>
                            Wir verarbeiten Ihre personenbezogenen Daten gemäß der DSGVO. Details entnehmen Sie bitte 
                            unserer Datenschutzerklärung.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 11 Haftung</h2>
                        <p>
                            Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der 
                            Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit. Für leichte Fahrlässigkeit haften 
                            wir nur bei Verletzung wesentlicher Vertragspflichten.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 12 Änderungen der AGB</h2>
                        <p>
                            Wir behalten uns vor, diese AGB mit einer Frist von vier Wochen zu ändern. Sie werden über 
                            Änderungen per E-Mail informiert. Widersprechen Sie nicht innerhalb der Frist, gelten die 
                            neuen AGB als akzeptiert.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">§ 13 Schlussbestimmungen</h2>
                        <p>
                            Es gilt das Recht der Republik Österreich. Gerichtsstand ist Wien. Sollten einzelne 
                            Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                        </p>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                        <p className="text-sm">
                            <strong>Stand:</strong> Januar 2024<br />
                            <strong>Bei Fragen:</strong> legal@vermitify.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}