import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function DocumentVersionHistory({ documentId, onSelectVersion }) {
  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => base44.entities.DocumentVersion?.filter?.({ document_id: documentId }) || []
  });

  const statusConfig = {
    draft: { icon: FileText, color: 'text-slate-500', label: 'Entwurf' },
    pending_approval: { icon: AlertCircle, color: 'text-yellow-600', label: 'Genehmigung ausstehend' },
    approved: { icon: CheckCircle, color: 'text-green-600', label: 'Genehmigt' },
    rejected: { icon: AlertCircle, color: 'text-red-600', label: 'Abgelehnt' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Versionsverlauf</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Versionen vorhanden</p>
          ) : (
            versions.sort((a, b) => b.version_number - a.version_number).map(version => {
              const statusInfo = statusConfig[version.status] || statusConfig.draft;
              const Icon = statusInfo.icon;
              return (
                <div key={version.id} className="border rounded-lg p-3 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-4 h-4 mt-1 ${statusInfo.color}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">v{version.version_number}</p>
                        <p className="text-xs text-slate-600 mt-1">{version.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {version.created_by}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(version.created_date), 'dd.MM.yy', { locale: de })}
                          </Badge>
                          <Badge className={`text-xs ${version.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {version.file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={version.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSelectVersion?.(version)}
                      >
                        Wählen
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}