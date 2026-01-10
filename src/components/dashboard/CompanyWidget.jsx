import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CompanyWidget() {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies', 'widget'],
    queryFn: () => base44.entities.Company.list('-updated_date').then(c => c.slice(0, 3)),
    staleTime: 5 * 60 * 1000
  });

  const activeCompanies = companies.filter(c => c.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="w-5 h-5" />
          Unternehmensübersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {companies.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Keine Unternehmen erstellt</p>
        ) : (
          <>
            {companies.map(company => (
              <div key={company.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm text-slate-900">{company.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {company.legal_form}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{company.address}</p>
              </div>
            ))}

            <Link to={createPageUrl('Companies')}>
              <Button variant="outline" className="w-full justify-between">
                Alle anzeigen ({companies.length})
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}