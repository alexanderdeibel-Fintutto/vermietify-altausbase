import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, File, FileText, Image, AlertCircle } from 'lucide-react';

export default function TenantDocumentsViewer({ documents, searchQuery }) {
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-red-600" />;
    if (['doc', 'docx'].includes(ext)) return <File className="w-5 h-5 text-blue-600" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <Image className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-slate-600" />;
  };

  const getDocumentType = (fileName) => {
    if (fileName.includes('Mietvertrag')) return 'Mietvertrag';
    if (fileName.includes('Rechnung')) return 'Rechnung';
    if (fileName.includes('Quittung')) return 'Quittung';
    if (fileName.includes('Bestätigung')) return 'Bestätigung';
    return 'Dokument';
  };

  const filteredDocs = documents.filter(doc =>
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedDocs = {
    important: filteredDocs.filter(d => d.document_name.includes('Mietvertrag')),
    financial: filteredDocs.filter(d => d.document_name.includes('Rechnung') || d.document_name.includes('Quittung')),
    other: filteredDocs.filter(d => !d.document_name.includes('Mietvertrag') && !d.document_name.includes('Rechnung') && !d.document_name.includes('Quittung'))
  };

  const renderDocumentGroup = (title, docs) => {
    if (docs.length === 0) return null;

    return (
      <div key={title}>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          {title === 'important' && <AlertCircle className="w-4 h-4 text-red-600" />}
          {title === 'important' ? 'Wichtige Dokumente' :
           title === 'financial' ? 'Finanzielle Unterlagen' :
           'Weitere Dokumente'}
        </h3>
        <div className="space-y-2 mb-6">
          {docs.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.document_name)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{doc.document_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getDocumentType(doc.document_name)}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  download
                  className="ml-2 flex-shrink-0"
                >
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Keine Dokumente gefunden
          </CardContent>
        </Card>
      ) : (
        <>
          {renderDocumentGroup('important', groupedDocs.important)}
          {renderDocumentGroup('financial', groupedDocs.financial)}
          {renderDocumentGroup('other', groupedDocs.other)}
        </>
      )}
    </div>
  );
}