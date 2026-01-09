import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function DocumentInboxDashboardWidget() {
  const { data: inboxStats = {} } = useQuery({
    queryKey: ['documentInboxStats'],
    queryFn: async () => {
      const items = await base44.entities.DocumentInbox.list('-created_date', 100);
      return {
        total: items.length,
        pending: items.filter(i => i.status === 'pending').length,
        processing: items.filter(i => i.status === 'processing').length,
        auto_matched: items.filter(i => i.status === 'auto_matched').length,
        approved: items.filter(i => i.status === 'approved').length,
        recent: items.slice(0, 3)
      };
    },
    refetchInterval: 10000
  });

  if (inboxStats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📥 Dokumenten-Eingang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Keine Dokumente eingegangen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📥 Dokumenten-Eingang
          </span>
          {inboxStats.pending > 0 && (
            <Badge className="bg-red-600">{inboxStats.pending}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-600">Gesamt</p>
            <p className="text-lg font-bold">{inboxStats.total}</p>
          </div>
          <div className="bg-yellow-100 rounded p-2">
            <p className="text-xs text-slate-600">Ausstehend</p>
            <p className="text-lg font-bold text-yellow-700">{inboxStats.pending}</p>
          </div>
          <div className="bg-green-100 rounded p-2">
            <p className="text-xs text-slate-600">Auto-Match</p>
            <p className="text-lg font-bold text-green-700">{inboxStats.auto_matched}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Erledigt</p>
            <p className="text-lg font-bold">{inboxStats.approved}</p>
          </div>
        </div>

        {inboxStats.recent && inboxStats.recent.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-slate-700">Zuletzt eingegangen:</p>
            {inboxStats.recent.map(doc => (
              <p key={doc.id} className="text-xs text-slate-600">
                • {doc.original_filename?.substring(0, 40)}...
              </p>
            ))}
          </div>
        )}

        <Link to={createPageUrl('DocumentInbox')} className="block">
          <Button className="w-full gap-2 text-xs h-8 bg-blue-600 hover:bg-blue-700">
            Jetzt prüfen
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}