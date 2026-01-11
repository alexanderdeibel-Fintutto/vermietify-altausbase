import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Lock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TenantDocuments({ tenantId }) {
  const { data: leases, isLoading: leasesLoading } = useQuery({
    queryKey: ['tenantLeases', tenantId],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({
        tenant_id: tenantId
      });
      return contracts;
    }
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['tenantDocuments', tenantId],
    queryFn: async () => {
      const docs = await base44.entities.GeneratedDocument.filter({
        tenant_id: tenantId
      });
      
      // Filtere relevante Dokumenttypen für Mieter
      const relevantTypes = [
        'mietvertrag',
        'uebergabeprotokoll_einzug',
        'uebergabeprotokoll_auszug',
        'betriebskostenabrechnung',
        'wohnungsgeberbestaetigung',
        'zahlungserinnerung',
        'mieterhoehung'
      ];

      return docs
        .filter(doc => relevantTypes.includes(doc.document_type))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const isLoading = leasesLoading || docsLoading;

  const getDocumentTypeLabel = (type) => {
    const labels = {
      mietvertrag: 'Mietvertrag',
      uebergabeprotokoll_einzug: 'Übergabeprotokoll Einzug',
      uebergabeprotokoll_auszug: 'Übergabeprotokoll Auszug',
      betriebskostenabrechnung: 'Betriebskostenabrechnung',
      wohnungsgeberbestaetigung: 'Wohnungsgeberbescheinigung',
      zahlungserinnerung: 'Zahlungserinnerung',
      mieterhoehung: 'Mieterhöhung',
      kuendigung: 'Kündigung'
    };
    return labels[type] || type;
  };

  const getDocumentIcon = (type) => {
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const handleDownload = async (document) => {
    if (document.pdf_url) {
      window.open(document.pdf_url, '_blank');
    } else if (document.pdf_file_uri) {
      try {
        const signedUrl = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: document.pdf_file_uri,
          expires_in: 3600
        });
        window.open(signedUrl.signed_url, '_blank');
      } catch (error) {
        console.error('Download-Fehler:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Lädt...</div>;
  }

  const allDocuments = documents || [];
  const hasDocuments = allDocuments.length > 0 || (leases && leases.length > 0);

  return (
    <div className="space-y-6">
      {/* Mietverträge */}
      {leases && leases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Aktive Mietverträge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leases.map((lease) => (
              <div key={lease.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      Mietvertrag ab {format(new Date(lease.start_date), 'dd. MMMM yyyy', { locale: de })}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Vertragsdatum: {format(new Date(lease.contract_date), 'dd. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                  <Badge variant={lease.status === 'active' ? 'default' : 'secondary'}>
                    {lease.status === 'active' && 'Aktiv'}
                    {lease.status === 'terminated' && 'Gekündigt'}
                    {lease.status === 'expired' && 'Beendet'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4 pb-4 border-b">
                  <div>
                    <span className="text-slate-600">Kaltmiete:</span>
                    <p className="font-semibold">{lease.base_rent?.toFixed(2)}€</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Nebenkosten:</span>
                    <p className="font-semibold">{lease.utilities?.toFixed(2)}€</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Warmmiete:</span>
                    <p className="font-semibold">{lease.total_rent?.toFixed(2)}€</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Kaution:</span>
                    <p className="font-semibold">{lease.deposit?.toFixed(2)}€</p>
                  </div>
                </div>

                {lease.contract_text && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Anschauen
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Herunterladen
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weitere Dokumente */}
      {allDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Weitere Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    {getDocumentIcon(doc.document_type)}
                    <div>
                      <p className="font-semibold text-slate-900">
                        {getDocumentTypeLabel(doc.document_type)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(doc.created_date), 'dd. MMMM yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    className="gap-2 flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info-Box wenn keine Dokumente */}
      {!hasDocuments && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">
              Aktuell sind keine Dokumente verfügbar. Diese werden hier angezeigt, sobald sie von der Verwaltung bereitgestellt werden.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hinweis auf Datenschutz */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Datenschutz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>
            Alle Ihre Dokumente werden verschlüsselt gespeichert und sind nur für Sie und die Wohnungsverwaltung zugänglich. 
            Download-Links sind zeitlich begrenzt und verfallen nach 1 Stunde.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}