import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Zap, ClipboardCheck } from 'lucide-react';

export default function EnhancedDocumentAccess({ tenantId, contractId, buildingId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['tenant-documents', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      return await base44.entities.Document.filter({ building_id: buildingId });
    },
    enabled: !!buildingId
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['building-inspections', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      return await base44.entities.BuildingInspection.filter({ 
        building_id: buildingId,
        status: 'completed'
      }, '-inspection_date', 5);
    },
    enabled: !!buildingId
  });

  const energyPassports = documents.filter(d => d.document_type === 'energy_passport');
  const contractDocs = documents.filter(d => d.document_type === 'lease_contract');
  const otherDocs = documents.filter(d => !['energy_passport', 'lease_contract'].includes(d.document_type));

  const DocumentCard = ({ doc, icon: Icon, color }) => (
    <div className="p-3 border rounded hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${color} rounded flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{doc.name}</h4>
            <p className="text-xs text-slate-600">
              {new Date(doc.created_date).toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>
        {doc.file_url && (
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Energieausweise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {energyPassports.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">Keine verfügbar</p>
            ) : (
              energyPassports.map(doc => (
                <DocumentCard key={doc.id} doc={doc} icon={Zap} color="bg-green-600" />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              Inspektionsberichte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inspections.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">Keine verfügbar</p>
            ) : (
              inspections.map(insp => (
                <div key={insp.id} className="p-3 border rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{insp.inspection_type}</h4>
                      <p className="text-xs text-slate-600">
                        {new Date(insp.inspection_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {insp.overall_rating || 'Bewertet'}
                    </Badge>
                  </div>
                  {insp.report_url && (
                    <a href={insp.report_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-3 h-3 mr-2" />
                        Bericht herunterladen
                      </Button>
                    </a>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Weitere Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contractDocs.map(doc => (
            <DocumentCard key={doc.id} doc={doc} icon={FileText} color="bg-slate-600" />
          ))}
          {otherDocs.map(doc => (
            <DocumentCard key={doc.id} doc={doc} icon={FileText} color="bg-slate-600" />
          ))}
          {contractDocs.length + otherDocs.length === 0 && (
            <p className="text-sm text-slate-600 text-center py-4">Keine Dokumente verfügbar</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}