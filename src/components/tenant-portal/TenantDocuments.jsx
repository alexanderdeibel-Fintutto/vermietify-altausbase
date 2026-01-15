import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Calendar } from 'lucide-react';

export default function TenantDocuments({ leaseId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['tenantDocuments', leaseId],
    queryFn: async () => {
      const all = await base44.entities.GeneratedDocument.list();
      return all.filter(d => d.lease_contract_id === leaseId).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    }
  });

  const categorizedDocs = {
    'Mietvertrag': documents.filter(d => d.document_type === 'LEASE_CONTRACT'),
    'Rechnungen': documents.filter(d => d.document_type === 'INVOICE'),
    'Nebenkosten': documents.filter(d => d.document_type === 'OPERATING_COST_STATEMENT'),
    'Sonstiges': documents.filter(d => !['LEASE_CONTRACT', 'INVOICE', 'OPERATING_COST_STATEMENT'].includes(d.document_type))
  };

  return (
    <div className="space-y-6">
      {Object.entries(categorizedDocs).map(([category, docs]) => (
        docs.length > 0 && (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 group">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.title || doc.document_type}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.created_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4 text-blue-600 cursor-pointer" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}

      {documents.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600 py-8">
            Keine Dokumente verfügbar
          </CardContent>
        </Card>
      )}
    </div>
  );
}