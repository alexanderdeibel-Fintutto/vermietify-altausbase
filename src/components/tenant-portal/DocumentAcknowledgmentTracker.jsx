import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, User } from 'lucide-react';

export default function DocumentAcknowledgmentTracker({ documentId }) {
  const { data: document } = useQuery({
    queryKey: ['portal-document', documentId],
    queryFn: async () => {
      const docs = await base44.entities.TenantPortalDocument.filter({ id: documentId });
      return docs[0];
    },
    enabled: !!documentId
  });
  
  if (!document || !document.requires_acknowledgment) {
    return null;
  }
  
  const acknowledgedBy = document.acknowledged_by || [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Bestätigungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {acknowledgedBy.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            Noch keine Bestätigung erhalten
          </div>
        ) : (
          <div className="space-y-2">
            <Badge className="bg-green-100 text-green-800">
              {acknowledgedBy.length} bestätigt
            </Badge>
            <div className="space-y-1 mt-3">
              {acknowledgedBy.map((tenantId, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>Mieter {tenantId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}