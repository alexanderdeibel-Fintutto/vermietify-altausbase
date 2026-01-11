import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TenantOperatingCosts({ tenantId }) {
  const { data: statements, isLoading } = useQuery({
    queryKey: ['tenantOperatingCosts', tenantId],
    queryFn: async () => {
      const docs = await base44.entities.GeneratedDocument.filter({
        tenant_id: tenantId,
        document_type: 'betriebskostenabrechnung'
      });
      return docs.sort((a, b) => b.document_data?.year - a.document_data?.year);
    }
  });

  if (isLoading) return <div className="text-center py-8">Lädt...</div>;

  if (!statements || statements.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          Keine Betriebskostenabrechnungen vorhanden
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {statements.map((statement) => {
        const balance = statement.document_data?.balance || 0;
        const isRefund = balance > 0;

        return (
          <Card key={statement.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Betriebskostenabrechnung {statement.document_data?.year}
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    {format(new Date(statement.created_date), 'dd. MMMM yyyy', { locale: de })}
                  </p>
                </div>
                <Badge variant={isRefund ? 'default' : 'secondary'}>
                  {isRefund ? 'Erstattung' : 'Nachzahlung'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Kostenaufschlüsselung */}
                {statement.document_data?.costsBreakdown && (
                  <div className="pb-3 border-b">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Kostenaufschlüsselung:</p>
                    <div className="space-y-1 text-sm">
                      {Object.entries(statement.document_data.costsBreakdown).map(([category, amount]) => (
                        <div key={category} className="flex justify-between text-slate-600">
                          <span className="capitalize">{category}:</span>
                          <span>{amount.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Berechnung */}
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Gesamtbetriebskosten (Ihr Anteil):</span>
                    <span className="font-semibold">{statement.document_data?.totalCosts?.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bereits gezahlte Vorauszahlungen:</span>
                    <span className="font-semibold">{statement.document_data?.prepaidAmount?.toFixed(2)}€</span>
                  </div>
                  <div className={`flex justify-between text-lg font-bold pt-2 border-t ${
                    isRefund ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>{isRefund ? 'Ihnen zustehende Erstattung:' : 'Nachzahlungsbetrag:'}</span>
                    <span>{Math.abs(balance).toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}