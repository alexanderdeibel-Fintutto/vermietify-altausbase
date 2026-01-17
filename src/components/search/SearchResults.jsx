import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, FileText, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SearchResults({ results = [] }) {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'Building': return Building2;
      case 'Tenant': return Users;
      case 'LeaseContract': return FileText;
      default: return File;
    }
  };

  const getPageUrl = (type, id) => {
    const pageMap = {
      'Building': 'BuildingDetail',
      'Tenant': 'TenantDetail',
      'LeaseContract': 'ContractDetail'
    };
    return createPageUrl(pageMap[type] || 'Dashboard') + `?id=${id}`;
  };

  return (
    <div className="space-y-2">
      {results.map((result) => {
        const Icon = getIcon(result.entity_type);
        
        return (
          <Card 
            key={result.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(getPageUrl(result.entity_type, result.id))}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--vf-primary-100)] flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[var(--vf-primary-600)]" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-[var(--theme-text-muted)]">
                    {result.entity_type}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}