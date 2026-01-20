import React from 'react';

export default function VermitifyDatenschutz() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>

                <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
                        <h3 className="text-xl font-semibold mb-2">Allgemeine Hinweise</h3>
                        <p>
                            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                            Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                            denen Sie persönlich identifiziert werden können.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">2. Datenerfassung auf unserer Website</h2>
                        <h3 className="text-xl font-semibold mb-2">Wer ist verantwortlich für die Datenerfassung?</h3>
                        <p>
                            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                            können Sie dem Impressum dieser Website entnehmen.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 mt-4">Wie erfassen wir Ihre Daten?</h3>
                        <p>
                            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich 
                            z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
                        </p>
                        <p className="mt-2">
                            Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind 
                            vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">3. Hosting und Content Delivery Networks (CDN)</h2>
                        <p>
                            Wir hosten die Inhalte unserer Website bei folgenden Anbietern:
                        </p>
                        <p className="mt-2">
                            Die Server befinden sich in ISO-27001 zertifizierten Rechenzentren in Deutschland. 
                            Alle Daten werden verschlüsselt übertragen (SSL/TLS) und gespeichert.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">4. Ihre Rechte</h2>
                        <p>Sie haben jederzeit das Recht:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten</li>
                            <li>Die Berichtigung unrichtiger Daten zu verlangen</li>
                            <li>Die Löschung Ihrer Daten zu verlangen</li>
                            <li>Die Einschränkung der Datenverarbeitung zu verlangen</li>
                            <li>Der Datenverarbeitung zu widersprechen</li>
                            <li>Datenübertragbarkeit zu verlangen</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">5. Analyse-Tools und Tools von Drittanbietern</h2>
                        <p>
                            Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. 
                            Das geschieht vor allem mit sogenannten Analyseprogrammen.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">6. Newsletter</h2>
                        <p>
                            Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen 
                            eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der 
                            Inhaber der angegebenen E-Mail-Adresse sind.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">7. Zahlungsanbieter</h2>
                        <p>
                            Wir setzen für die Zahlungsabwicklung den Dienst Stripe ein. Anbieter ist die Stripe Inc., 
                            510 Townsend Street, San Francisco, CA 94103, USA.
                        </p>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                        <p className="text-sm">
                            <strong>Stand:</strong> Januar 2024<br />
                            <strong>Kontakt Datenschutz:</strong> datenschutz@vermitify.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}