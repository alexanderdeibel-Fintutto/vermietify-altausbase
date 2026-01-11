import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Search, File } from 'lucide-react';

export default function TenantDocumentLibrary({ tenantId, unitId }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: documents = [] } = useQuery({
    queryKey: ['tenant-documents', tenantId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ tenant_id: tenantId });
      return docs;
    }
  });

  const { data: energyPassport } = useQuery({
    queryKey: ['energy-passport', unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const unit = await base44.entities.Unit.read(unitId);
      const passports = await base44.entities.EnergyPassport.filter({ building_id: unit.building_id });
      return passports[0];
    },
    enabled: !!unitId
  });

  const { data: handoverProtocols = [] } = useQuery({
    queryKey: ['handover-protocols', tenantId],
    queryFn: () => base44.entities.HandoverProtocol.filter({ tenant_id: tenantId })
  });

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Meine Dokumente
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Dokumente durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="contract">Vertrag</TabsTrigger>
            <TabsTrigger value="energy">Energie</TabsTrigger>
            <TabsTrigger value="handover">Übergabe</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2 mt-4">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-slate-600">{new Date(doc.created_date).toLocaleDateString('de-DE')}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="energy" className="mt-4">
            {energyPassport ? (
              <div className="p-4 border rounded bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Energieausweis</h3>
                  <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">
                    {energyPassport.energy_class}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Typ:</span>
                    <span>{energyPassport.passport_type === 'consumption' ? 'Verbrauchsausweis' : 'Bedarfsausweis'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Verbrauch:</span>
                    <span>{energyPassport.energy_consumption_kwh} kWh/m²a</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gültig bis:</span>
                    <span>{new Date(energyPassport.expiry_date).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
                {energyPassport.document_url && (
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    <Download className="w-4 h-4 mr-2" />
                    PDF herunterladen
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-600 py-4">Kein Energieausweis verfügbar</p>
            )}
          </TabsContent>

          <TabsContent value="handover" className="space-y-2 mt-4">
            {handoverProtocols.map(protocol => (
              <div key={protocol.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {protocol.protocol_type === 'move_in' ? 'Einzug' : 'Auszug'}
                  </span>
                  <span className="text-xs text-slate-600">
                    {new Date(protocol.inspection_date).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2">
                  {protocol.issues?.length || 0} Mängel dokumentiert
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Protokoll ansehen
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}