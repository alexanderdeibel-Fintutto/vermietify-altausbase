import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Users, FileText, DollarSign, Clipboard } from 'lucide-react';

/**
 * Display search results organized by entity type
 */
export default function SearchResults({ results, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const totalResults = (results.buildings?.length || 0) + 
                       (results.tenants?.length || 0) + 
                       (results.contracts?.length || 0) + 
                       (results.documents?.length || 0) + 
                       (results.invoices?.length || 0);

  if (totalResults === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-light">Keine Ergebnisse gefunden</p>
      </div>
    );
  }

  const ResultCard = ({ icon: Icon, title, subtitle, type, id, data }) => {
    let href = '#';
    if (type === 'building') href = `${createPageUrl('BuildingDetail')}?id=${id}`;
    else if (type === 'tenant') href = createPageUrl('Tenants');
    else if (type === 'contract') href = createPageUrl('Contracts');
    else if (type === 'document') href = createPageUrl('Documents');
    else if (type === 'invoice') href = createPageUrl('Invoices');

    return (
      <Link to={href}>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-light text-slate-900">{title}</h4>
              <p className="text-sm font-light text-slate-600 truncate">{subtitle}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {data?.status && <Badge variant="outline" className="text-xs font-light">{data.status}</Badge>}
                {data?.type && <Badge variant="outline" className="text-xs font-light">{data.type}</Badge>}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* BUILDINGS */}
      {results.buildings?.length > 0 && (
        <div>
          <h3 className="text-lg font-light text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gebäude ({results.buildings.length})
          </h3>
          <div className="space-y-2">
            {results.buildings.map(b => (
              <ResultCard
                key={b.id}
                icon={Building2}
                title={b.name || 'Gebäude'}
                subtitle={b.street || 'Keine Adresse'}
                type="building"
                id={b.id}
                data={{ type: b.type }}
              />
            ))}
          </div>
        </div>
      )}

      {/* TENANTS */}
      {results.tenants?.length > 0 && (
        <div>
          <h3 className="text-lg font-light text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mieter ({results.tenants.length})
          </h3>
          <div className="space-y-2">
            {results.tenants.map(t => (
              <ResultCard
                key={t.id}
                icon={Users}
                title={t.name || 'Mieter'}
                subtitle={t.email || t.phone || 'Keine Kontaktinfo'}
                type="tenant"
                id={t.id}
                data={{ status: t.status }}
              />
            ))}
          </div>
        </div>
      )}

      {/* CONTRACTS */}
      {results.contracts?.length > 0 && (
        <div>
          <h3 className="text-lg font-light text-slate-900 mb-3 flex items-center gap-2">
            <Clipboard className="w-5 h-5" />
            Verträge ({results.contracts.length})
          </h3>
          <div className="space-y-2">
            {results.contracts.map(c => (
              <ResultCard
                key={c.id}
                icon={Clipboard}
                title={c.tenant_name || 'Vertrag'}
                subtitle={c.property_name || 'Keine Liegenschaft'}
                type="contract"
                id={c.id}
                data={{ status: c.status }}
              />
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      {results.documents?.length > 0 && (
        <div>
          <h3 className="text-lg font-light text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumente ({results.documents.length})
          </h3>
          <div className="space-y-2">
            {results.documents.map(d => (
              <ResultCard
                key={d.id}
                icon={FileText}
                title={d.name || 'Dokument'}
                subtitle={d.description || 'Keine Beschreibung'}
                type="document"
                id={d.id}
                data={{ type: d.type }}
              />
            ))}
          </div>
        </div>
      )}

      {/* INVOICES */}
      {results.invoices?.length > 0 && (
        <div>
          <h3 className="text-lg font-light text-slate-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Rechnungen ({results.invoices.length})
          </h3>
          <div className="space-y-2">
            {results.invoices.map(i => (
              <ResultCard
                key={i.id}
                icon={DollarSign}
                title={i.number || 'Rechnung'}
                subtitle={`${i.recipient_name || 'Keine Empfänger'} - €${i.total?.toFixed(2) || '0.00'}`}
                type="invoice"
                id={i.id}
                data={{ status: i.status }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs font-light text-slate-500 text-center pt-4">
        {results.took_ms && `Suche in ${results.took_ms}ms durchgeführt`}
      </div>
    </div>
  );
}