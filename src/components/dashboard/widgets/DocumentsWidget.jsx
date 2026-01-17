import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TimeAgo from '@/components/shared/TimeAgo';

export default function DocumentsWidget() {
  const { data: documents = [] } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="font-medium text-sm">{doc.name || doc.title}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-[var(--theme-text-muted)]">
                  {doc.document_type || 'Dokument'}
                </div>
                <TimeAgo date={doc.created_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={createPageUrl('Documents')} className="w-full">
          <Button variant="outline" className="w-full">
            Alle ansehen
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}