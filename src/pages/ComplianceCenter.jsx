import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Database, Download, Trash2 } from 'lucide-react';
import GDPRDataExport from '@/components/compliance/GDPRDataExport';
import GDPRDataDeletion from '@/components/compliance/GDPRDataDeletion';
import DataRetentionPolicy from '@/components/compliance/DataRetentionPolicy';
import ConsentManager from '@/components/compliance/ConsentManager';

export default function ComplianceCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-7 h-7" />
          Compliance Center
        </h1>
        <p className="text-slate-600">DSGVO-konforme Datenverwaltung und Compliance-Tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">DSGVO</p>
                <p className="text-2xl font-bold text-green-600">✓</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aufbewahrung</p>
                <p className="text-2xl font-bold text-blue-600">5</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Export</p>
                <p className="text-2xl font-bold text-purple-600">✓</p>
              </div>
              <Download className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Löschung</p>
                <p className="text-2xl font-bold text-red-600">✓</p>
              </div>
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="export">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Datenexport
          </TabsTrigger>
          <TabsTrigger value="deletion">
            <Trash2 className="w-4 h-4 mr-2" />
            Datenlöschung
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Database className="w-4 h-4 mr-2" />
            Aufbewahrung
          </TabsTrigger>
          <TabsTrigger value="consent">
            <FileText className="w-4 h-4 mr-2" />
            Einwilligung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GDPRDataExport />
            <Card>
              <CardHeader>
                <CardTitle>DSGVO Art. 15 - Auskunftsrecht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Betroffenenrechte:</strong> Jede Person hat das Recht, Auskunft über 
                  die sie betreffenden personenbezogenen Daten zu erhalten.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <strong>Exportierte Daten umfassen:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Benutzerkonto und Profile</li>
                    <li>Aktivitätsprotokolle</li>
                    <li>Test-Sessions (falls Tester)</li>
                    <li>Rollen und Berechtigungen</li>
                    <li>Alle verknüpften Datensätze</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-600">
                  Der Export erfolgt als JSON-Datei in maschinenlesbarem Format.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deletion" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GDPRDataDeletion />
            <Card>
              <CardHeader>
                <CardTitle>DSGVO Art. 17 - Recht auf Löschung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Recht auf Vergessenwerden:</strong> Personenbezogene Daten müssen 
                  gelöscht werden, wenn sie nicht mehr erforderlich sind.
                </p>
                <div className="bg-red-50 p-3 rounded-lg">
                  <strong>Löschprozess:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Vollständige Anonymisierung aller Daten</li>
                    <li>Löschen personenbezogener Informationen</li>
                    <li>Entfernen aus allen Backups</li>
                    <li>Dokumentation der Löschung</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-600">
                  ⚠️ Diese Aktion kann nicht rückgängig gemacht werden!
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataRetentionPolicy />
            <Card>
              <CardHeader>
                <CardTitle>DSGVO Art. 5 - Speicherbegrenzung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Grundsatz:</strong> Personenbezogene Daten dürfen nur so lange 
                  gespeichert werden, wie es für die Zwecke erforderlich ist.
                </p>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <strong>Automatische Löschung:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>UserActivity: nach 2 Jahren</li>
                    <li>TestSessions: nach 1 Jahr</li>
                    <li>API Keys: bei Ablauf</li>
                    <li>Logs: nach 90 Tagen</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-600">
                  Konfigurierbar über die Funktion <code>cleanupOldData</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consent" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConsentManager />
            <Card>
              <CardHeader>
                <CardTitle>DSGVO Art. 7 - Einwilligung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Nachweispflicht:</strong> Der Verantwortliche muss nachweisen können, 
                  dass die betroffene Person in die Verarbeitung eingewilligt hat.
                </p>
                <div className="bg-green-50 p-3 rounded-lg">
                  <strong>Anforderungen:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Freiwillige Einwilligung</li>
                    <li>Informierte Entscheidung</li>
                    <li>Eindeutige Handlung</li>
                    <li>Widerrufbarkeit jederzeit</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-600">
                  Dokumentation von Zeitpunkt, Methode und Wortlaut der Einwilligung.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Compliance-Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>✓ DSGVO-konform implementiert</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>✓ Betroffenenrechte umgesetzt (Art. 15-17)</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>✓ Datenminimierung & Speicherbegrenzung</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>✓ Einwilligungsverwaltung aktiv</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}