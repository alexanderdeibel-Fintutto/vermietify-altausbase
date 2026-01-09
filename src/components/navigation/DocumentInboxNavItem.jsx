import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function DocumentInboxNavItem() {
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['documentInboxPendingCount'],
    queryFn: async () => {
      const items = await base44.entities.DocumentInbox.filter({ status: 'pending' });
      return items.length;
    },
    refetchInterval: 30000
  });

  return (
    <Link
      to={createPageUrl('DocumentInbox')}
      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
    >
      <span>📥 Dokumenten-Eingang</span>
      {pendingCount > 0 && (
        <Badge className="ml-auto bg-red-600 text-white text-xs">
          {pendingCount}
        </Badge>
      )}
    </Link>
  );
}