import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import LeaseContractAnalyzer from '@/components/contracts/LeaseContractAnalyzer';
import ContractDocumentManager from '@/components/contracts/ContractDocumentManager';
import ContractRenewalTracker from '@/components/contracts/ContractRenewalTracker';

export default function ContractDetailPage() {
  const { id } = useParams();
  const [editMode, setEditMode] = useState(false);

  const { data: contract } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => base44.entities.LeaseContract?.read?.(id) || {}
  });

  if (!contract?.id) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Vertrag wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📋 Mietvertrag</h1>
          <p className="text-slate-600 mt-1">{contract.tenant_name || 'Vertrag'} - {contract.unit_name || 'Einheit'}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />PDF</Button>
          <Button onClick={() => setEditMode(!editMode)}><Edit className="w-4 h-4 mr-2" />{editMode ? 'Fertig' : 'Bearbeiten'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-900">Mieter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{contract.tenant_name || '—'}</p>
          </CardContent>
        </Card>

        <Card className="border border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm text-green-900">Monatliche Miete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">€{(contract.rent || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-sm text-purple-900">Vertragsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-600">{contract.status === 'active' ? 'Aktiv' : 'Beendet'}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vertragsdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600">Wohneinheit</p>
              <p className="text-lg font-semibold text-slate-900">{contract.unit_name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Gebäude</p>
              <p className="text-lg font-semibold text-slate-900">{contract.building_name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Vertragsbeginn</p>
              <p className="text-lg font-semibold text-slate-900">{contract.start_date ? format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de }) : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Vertragsende</p>
              <p className="text-lg font-semibold text-slate-900">{contract.end_date ? format(new Date(contract.end_date), 'dd.MM.yyyy', { locale: de }) : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Kaution</p>
              <p className="text-lg font-semibold text-slate-900">€{(contract.deposit || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Nebenkosten</p>
              <p className="text-lg font-semibold text-slate-900">€{(contract.utilities || 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContractRenewalTracker contractId={contract.id} />
        <ContractDocumentManager contractId={contract.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700">{contract.notes || 'Keine Notizen vorhanden'}</p>
        </CardContent>
      </Card>

      <LeaseContractAnalyzer 
        contractId={contract.id} 
        contractText={contract.contract_text || contract.notes}
      />
    </div>
  );
}