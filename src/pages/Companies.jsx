import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CompanyFormDialog from '@/components/companies/CompanyFormDialog';

const legalFormLabels = {
  einzelunternehmen: 'Einzelunternehmen',
  gbr: 'GbR',
  ohg: 'OHG',
  kg: 'KG',
  gmbh: 'GmbH',
  ag: 'AG',
  se: 'SE',
  genossenschaft: 'Genossenschaft',
  ev: 'e.V.',
  other: 'Sonstige'
};

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-updated_date')
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (companyId) => base44.entities.Company.delete(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.legal_form.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Unternehmensmanagement</h1>
          <p className="text-slate-600 mt-1">Verwalte alle Ihre Unternehmen und deren Dokumentation</p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Unternehmen
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Nach Name, Rechtsform suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid gap-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Keine Unternehmen vorhanden</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFormDialogOpen(true)}
              >
                Erstes Unternehmen erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map(company => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{company.name}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {legalFormLabels[company.legal_form]}
                      </Badge>
                      <Badge variant={company.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {company.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{company.address}</p>
                    {company.industry && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium">Branche:</span> {company.industry}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl('CompanyDetailEnhanced', `companyId=${company.id}`)}>
                      <Button size="icon" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Wirklich löschen: ${company.name}?`)) {
                          deleteCompanyMutation.mutate(company.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <CompanyFormDialog
        isOpen={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
      />
    </div>
  );
}