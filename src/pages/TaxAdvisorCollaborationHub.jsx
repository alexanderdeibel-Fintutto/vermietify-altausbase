import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Share2, Download, Check } from 'lucide-react';

export default function TaxAdvisorCollaborationHub() {
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [shared, setShared] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1);
      return profiles[0];
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      return base44.functions.invoke('generateTaxAdvisorReport', { tax_year: taxYear });
    }
  });

  const shareReport = async () => {
    if (!advisorEmail) return;
    
    // Bericht generieren
    const reportRes = await generateReportMutation.mutateAsync();
    
    // Email senden
    await base44.integrations.Core.SendEmail({
      to: advisorEmail,
      subject: `Steuerbericht ${taxYear} - Zur Überprüfung`,
      body: `Hallo,\n\nhier ist der Steuerbericht für ${taxYear} zur Überprüfung.\n\nSteuerjahr: ${taxYear}\nLänder: ${profile.tax_jurisdictions.join(', ')}\nProfil: ${profile.profile_type}\n\nBitte überprüfen und bei Fragen kontaktieren.\n\nBest regards`
    });

    setShared(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Steuerberater-Collaboration</h1>
        <p className="text-slate-500 font-light mt-2">Teile Berichte mit deinem Steuerberater</p>
      </div>

      <Tabs defaultValue="share">
        <TabsList>
          <TabsTrigger value="share">Bericht Teilen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="communication">Kommunikation</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bericht mit Steuerberater teilen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-light">Email des Steuerberaters</label>
                <Input
                  type="email"
                  placeholder="berater@example.com"
                  value={advisorEmail}
                  onChange={(e) => setAdvisorEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={shareReport}
                disabled={!advisorEmail || generateReportMutation.isPending}
                className="w-full gap-2"
              >
                <Share2 className="w-4 h-4" />
                {shared ? 'Versendet' : 'Bericht generieren & teilen'}
              </Button>
              {shared && (
                <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700 font-light">
                  <Check className="w-4 h-4" />
                  Bericht wurde versendet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Verfügbare Berichte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Tax Summary {taxYear}
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Multi-Country Report
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Compliance Checklist
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dokumente für Steuerberater</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 font-light">
              <p>Alle erforderlichen Dokumente für die Steuererklärung:</p>
              <ul className="mt-3 space-y-1 text-xs">
                <li>✓ Kontoauszüge</li>
                <li>✓ Handelsbestätigungen</li>
                <li>✓ Immobiliendokumente</li>
                <li>✓ GmbH-Auszüge</li>
                <li>✓ Kryptowährungsreporte</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nachricht an Steuerberater</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nachricht eingeben..." />
              <Button className="w-full gap-2">
                <Mail className="w-4 h-4" />
                Nachricht senden
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}