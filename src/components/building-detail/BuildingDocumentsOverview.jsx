import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Eye } from 'lucide-react';

export default function BuildingDocumentsOverview({ buildingId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['buildingDocuments', buildingId],
    queryFn: () => base44.entities.Document.filter({ related_entity_id: buildingId }, '-created_date', 100),
    enabled: !!buildingId
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-light text-slate-900">Dokumente</h2>
      
      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Keine Dokumente vorhanden
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{doc.title}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(doc.created_date).toLocaleDateString('de-DE')}
                    </p>
                    {doc.file_url && (
                      <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}