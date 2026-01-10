import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Users, CreditCard, CheckCircle } from 'lucide-react';
import CompanyDocuments from '@/components/companies/CompanyDocuments';
import CompanyContacts from '@/components/companies/CompanyContacts';
import CompanyFinancials from '@/components/companies/CompanyFinancials';
import CompanyRecurringTasks from '@/components/companies/CompanyRecurringTasks';

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

export default function CompanyDetailEnhanced() {
  const { companyId } = useParams();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }).then(results => results[0])
  });

  if (isLoading) return <div className="p-6">Wird geladen...</div>;
  if (!company) return <div className="p-6">Unternehmen nicht gefunden</div>;

  const handleDocumentsUpdate = async (docs) => {
    await base44.entities.Company.update(companyId, { documents: docs });
    queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  };

  const handleContactsUpdate = async (contacts) => {
    await base44.entities.Company.update(companyId, { contacts });
    queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  };

  const handleBankAccountsUpdate = async (accounts) => {
    await base44.entities.Company.update(companyId, { bank_accounts: accounts });
    queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-8 h-8 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge className="bg-blue-100 text-blue-700">{legalFormLabels[company.legal_form]}</Badge>
          <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
            {company.status === 'active' ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Registrierungsnummer</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{company.registration_number || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Steuernummer</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{company.tax_id || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Mitarbeiter</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{company.employees_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gründung</p>
            <p className="text-lg font-bold text-slate-900 mt-2">
              {company.founding_date ? new Date(company.founding_date).getFullYear() : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Address */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600 mb-1">Geschäftsadresse</p>
          <p className="text-slate-900">{company.address}</p>
          {company.industry && (
            <p className="text-sm text-slate-600 mt-3">
              <span className="font-medium">Branche:</span> {company.industry}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Dokumente</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Kontakte</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Finanzen</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Aufgaben</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <CompanyDocuments
            companyId={companyId}
            legalForm={company.legal_form}
            documents={company.documents || []}
            onUpdate={handleDocumentsUpdate}
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <CompanyContacts
            contacts={company.contacts || []}
            onUpdate={handleContactsUpdate}
          />
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <CompanyFinancials
            companyId={companyId}
            bankAccounts={company.bank_accounts || []}
            onUpdate={handleBankAccountsUpdate}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <CompanyRecurringTasks companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}