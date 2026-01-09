import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share2, FileText, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdvancedTaxReporting() {
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [selectedReport, setSelectedReport] = useState('crypto');
  const [country, setCountry] = useState('DE');
  const [advisorEmail, setAdvisorEmail] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const items = await base44.entities.TaxProfile.list();
      return items[0];
    }
  });

  const generateCryptoReport = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateCryptoTaxReport', {
        tax_year: taxYear,
        country
      });
      return res.data;
    }
  });

  const generateAutoFiling = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateAutoFilingPackage', {
        tax_year: taxYear,
        country
      });
      return res.data;
    }
  });

  const shareWithAdvisor = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('shareWithTaxAdvisor', {
        advisor_email: advisorEmail,
        tax_year: taxYear,
        countries: [country],
        data_types: ['all']
      });
      return res.data;
    },
    onSuccess: () => setAdvisorEmail('')
  });

  const generateESG = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateESGTaxReport', {
        tax_year: taxYear,
        country
      });
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Advanced Tax Reporting</h1>
        <p className="text-slate-500 font-light mt-2">Spezialisierte Reports & Advisors Sharing für {taxYear}</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
        <div>
          <label className="text-xs font-light text-slate-600 block mb-2">Land</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-light"
          >
            {profile?.tax_jurisdictions?.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="filing">Auto-Filing</TabsTrigger>
          <TabsTrigger value="esg">ESG</TabsTrigger>
          <TabsTrigger value="share">Advisor</TabsTrigger>
        </TabsList>

        {/* Crypto Report */}
        <TabsContent value="crypto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Crypto Tax Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-light text-slate-600">
                Automatischer Report für alle Kryptowährungs-Transaktionen
              </p>
              <Button
                onClick={() => generateCryptoReport.mutate()}
                disabled={generateCryptoReport.isPending}
                className="w-full"
              >
                {generateCryptoReport.isPending ? 'Generiere...' : 'Report generieren'}
              </Button>
              {generateCryptoReport.data && (
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <p className="text-sm font-light"><strong>Gesamte Holdings:</strong> ${generateCryptoReport.data.crypto_report.total_current_value?.toLocaleString()}</p>
                  <p className="text-sm font-light"><strong>Steuerpflichtig:</strong> ${generateCryptoReport.data.crypto_report.taxable_income?.toLocaleString()}</p>
                  <p className="text-sm font-light"><strong>Meldepflichtig:</strong> {generateCryptoReport.data.crypto_report.is_reportable ? 'Ja' : 'Nein'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Filing */}
        <TabsContent value="filing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Auto-Filing Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-light text-slate-600">
                Fertige alle Formulare & Dateien zum Einreichen vor
              </p>
              <Button
                onClick={() => generateAutoFiling.mutate()}
                disabled={generateAutoFiling.isPending}
                className="w-full"
              >
                {generateAutoFiling.isPending ? 'Generiere...' : 'Filing Package erstellen'}
              </Button>
              {generateAutoFiling.data && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <p className="text-sm font-light"><strong>Formulare:</strong> {generateAutoFiling.data.filing_package.forms_included?.length}</p>
                  <p className="text-sm font-light"><strong>Zahlbar bis:</strong> {generateAutoFiling.data.filing_package.payment_deadline}</p>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Download className="w-3 h-3 mr-2" />
                    Download PDF & XML
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESG Report */}
        <TabsContent value="esg" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ESG/Nachhaltigkeit Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-light text-slate-600">
                ESG Tax Optimization & Nachhaltigkeit Metriken
              </p>
              <Button
                onClick={() => generateESG.mutate()}
                disabled={generateESG.isPending}
                className="w-full"
              >
                {generateESG.isPending ? 'Generiere...' : 'ESG Report erstellen'}
              </Button>
              {generateESG.data && (
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <p className="text-sm font-light"><strong>ESG Credits:</strong> ${generateESG.data.esg_report.estimated_esg_tax_credits?.toLocaleString()}</p>
                  <p className="text-sm font-light"><strong>Impact Score:</strong> {generateESG.data.esg_report.impact_score?.toFixed(1)}/10</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share with Advisor */}
        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Mit Steuerberat teilen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="email"
                placeholder="Berater Email"
                value={advisorEmail}
                onChange={(e) => setAdvisorEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-light"
              />
              <Button
                onClick={() => shareWithAdvisor.mutate()}
                disabled={shareWithAdvisor.isPending || !advisorEmail}
                className="w-full"
              >
                {shareWithAdvisor.isPending ? 'Teile...' : 'Mit Advisor teilen'}
              </Button>
              {shareWithAdvisor.data && (
                <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-light text-blue-900">
                    Daten mit {shareWithAdvisor.data.advisor_email} geteilt. Zugriff für 90 Tage.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}