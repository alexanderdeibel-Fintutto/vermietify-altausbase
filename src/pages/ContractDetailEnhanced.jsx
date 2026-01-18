import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, Link } from 'react-router-dom';
import { FileText, Euro, Wallet, TrendingUp, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import DepositManager from '@/components/tenants/DepositManager';
import RentChangeHistory from '@/components/contracts/RentChangeHistory';

export default function ContractDetailEnhanced() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => base44.entities.LeaseContract.get(contractId),
    enabled: !!contractId
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', contract?.tenant_id],
    queryFn: () => base44.entities.Tenant.get(contract.tenant_id),
    enabled: !!contract?.tenant_id
  });

  const { data: unit } = useQuery({
    queryKey: ['unit', contract?.unit_id],
    queryFn: () => base44.entities.Unit.get(contract.unit_id),
    enabled: !!contract?.unit_id
  });

  if (!contract) return <div>Laden...</div>;

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <div className="vf-detail-header">
        <Link to="/contracts" className="vf-detail-header__back">
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Verträgen
        </Link>

        <div className="vf-detail-header__top">
          <div className="flex items-start gap-4 flex-1">
            <div className="vf-detail-header__icon">
              <FileText className="h-7 w-7" />
            </div>
            <div className="vf-detail-header__info">
              <h1 className="vf-detail-header__title">Mietvertrag #{contract.id.substring(0, 8)}</h1>
              <p className="vf-detail-header__subtitle">
                {tenant?.name} • {unit?.einheit_nummer}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="vf-detail-tabs">
          <TabsTrigger value="overview">Vertragsdaten</TabsTrigger>
          <TabsTrigger value="rent">Miete & Nebenkosten</TabsTrigger>
          <TabsTrigger value="deposit">Kaution</TabsTrigger>
          <TabsTrigger value="adjustments">Anpassungen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
        </TabsList>

        <div className="vf-detail-main">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Vertragsinformationen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="vf-data-grid">
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Vertragsbeginn</div>
                    <div className="vf-data-field__value">
                      {contract.beginn_datum ? new Date(contract.beginn_datum).toLocaleDateString('de-DE') : '-'}
                    </div>
                  </div>
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Vertragsende</div>
                    <div className="vf-data-field__value">
                      {contract.ende_datum ? new Date(contract.ende_datum).toLocaleDateString('de-DE') : 'Unbefristet'}
                    </div>
                  </div>
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Status</div>
                    <div className="vf-data-field__value">
                      <span className="vf-badge vf-badge-success">{contract.status}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rent">
            <Card>
              <CardHeader>
                <CardTitle>Mietdetails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-secondary)]">Kaltmiete</span>
                    <CurrencyDisplay amount={contract.kaltmiete || 0} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-secondary)]">Nebenkosten-Vorauszahlung</span>
                    <CurrencyDisplay amount={contract.nebenkosten_vorauszahlung || 0} />
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[var(--theme-border)]">
                    <span className="font-semibold">Warmmiete gesamt</span>
                    <CurrencyDisplay amount={(contract.kaltmiete || 0) + (contract.nebenkosten_vorauszahlung || 0)} className="font-bold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposit">
            <DepositManager contractId={contractId} />
          </TabsContent>

          <TabsContent value="adjustments">
            <RentChangeHistory contractId={contractId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}