import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, AlertCircle } from 'lucide-react';

export default function ContractDocumentsWidget({ contractId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['contract-documents', contractId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ 
        contract_id: contractId,
        is_uploaded: true 
      });
      return docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!contractId
  });

  const importantDocs = documents.filter(d => 
    ['contract_amendment', 'termination', 'rent_receipt'].includes(d.category)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Vertragsdokumente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Keine Dokumente vorhanden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {importantDocs.length > 0 && (
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">
                    {importantDocs.length} wichtige(s) Dokument(e)
                  </span>
                </div>
              </div>
            )}

            {documents.slice(0, 8).map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">
                        {new Date(doc.created_date).toLocaleDateString('de-DE')}
                      </span>
                      {doc.category && (
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    download={doc.name}
                    className="flex-shrink-0"
                  >
                    <Button size="sm" variant="ghost">
                      <Download className="w-3 h-3" />
                    </Button>
                  </a>
                )}
              </div>
            ))}

            {documents.length > 8 && (
              <p className="text-xs text-center text-slate-600 pt-2">
                +{documents.length - 8} weitere Dokumente
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}