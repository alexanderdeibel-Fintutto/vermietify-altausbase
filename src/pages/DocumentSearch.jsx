import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AdvancedDocumentSearch from '@/components/documents/AdvancedDocumentSearch';
import { Search } from 'lucide-react';

export default function DocumentSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Get current company from user's first building
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['user-buildings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Building.list('-created_date', 1);
    },
    enabled: !!user
  });

  const companyId = useMemo(() => {
    return buildings[0]?.id || user?.id;
  }, [buildings, user]);

  if (!companyId) {
    return <div className="p-6">Wird geladen...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Dokumentensuche</h1>
          <p className="text-slate-600">Durchsuchen Sie Ihre Dokumente nach Inhalt und Metadaten</p>
        </div>
      </div>

      <AdvancedDocumentSearch companyId={companyId} initialQuery={query} />
    </div>
  );
}