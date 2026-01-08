import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Download, AlertCircle } from 'lucide-react';
import GDPRDataExport from '../components/compliance/GDPRDataExport';
import GDPRDataDeletion from '../components/compliance/GDPRDataDeletion';
import DataRetentionPolicy from '../components/compliance/DataRetentionPolicy';
import ConsentManager from '../components/compliance/ConsentManager';

export default function ComplianceCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compliance Center</h1>
        <p className="text-slate-600">Datenschutz und DSGVO-Konformität</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">DSGVO-Status</div>
                <div className="text-2xl font-bold text-green-600">Konform</div>
              </div>
              <Shield className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Daten-Exporte</div>
                <div className="text-2xl font-bold text-blue-600">Verfügbar</div>
              </div>
              <Download className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Audit-Logs</div>
                <div className="text-2xl font-bold text-purple-600">Aktiv</div>
              </div>
              <FileText className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gdpr" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gdpr">DSGVO</TabsTrigger>
          <TabsTrigger value="retention">Aufbewahrung</TabsTrigger>
          <TabsTrigger value="consent">Einwilligungen</TabsTrigger>
          <TabsTrigger value="info">Informationen</TabsTrigger>
        </TabsList>

        <TabsContent value="gdpr" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GDPRDataExport />
            <GDPRDataDeletion />
          </div>
        </TabsContent>

        <TabsContent value="retention">
          <DataRetentionPolicy />
        </TabsContent>

        <TabsContent value="consent">
          <ConsentManager />
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>DSGVO Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Implementierte Rechte:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Art. 15 - Auskunftsrecht</div>
                      <div className="text-sm text-slate-600">Benutzer können alle ihre Daten exportieren</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Art. 17 - Recht auf Löschung</div>
                      <div className="text-sm text-slate-600">Vollständige Löschung von Benutzerdaten möglich</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Art. 30 - Verarbeitungsverzeichnis</div>
                      <div className="text-sm text-slate-600">Aktivitäts-Logs dokumentieren alle Verarbeitungen</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Art. 32 - Datensicherheit</div>
                      <div className="text-sm text-slate-600">Rollen-basierte Zugriffskontrolle implementiert</div>
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}