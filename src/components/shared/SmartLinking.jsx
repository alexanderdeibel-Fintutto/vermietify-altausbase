import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, FileText, Users, Home, DollarSign, Calendar } from 'lucide-react';

const ENTITY_ICONS = {
  Building: <Home className="w-4 h-4" />,
  Unit: <Home className="w-4 h-4" />,
  LeaseContract: <Calendar className="w-4 h-4" />,
  Invoice: <FileText className="w-4 h-4" />,
  Tenant: <Users className="w-4 h-4" />,
  Payment: <DollarSign className="w-4 h-4" />
};

const ENTITY_COLORS = {
  Building: 'bg-slate-100',
  Unit: 'bg-blue-100',
  LeaseContract: 'bg-green-100',
  Invoice: 'bg-orange-100',
  Tenant: 'bg-purple-100',
  Payment: 'bg-yellow-100'
};

export default function SmartLinking({ entity, entityType = 'Building' }) {
  const getRelatedEntities = () => {
    const relations = [];

    switch (entityType) {
      case 'Building':
        if (entity.id) {
          relations.push({
            type: 'Unit',
            label: `Einheiten`,
            count: entity.unit_count || 0,
            icon: ENTITY_ICONS.Unit
          });
          relations.push({
            type: 'Invoice',
            label: 'Rechnungen',
            count: entity.invoice_count || 0,
            icon: ENTITY_ICONS.Invoice
          });
          relations.push({
            type: 'LeaseContract',
            label: 'Mietverträge',
            count: entity.contract_count || 0,
            icon: ENTITY_ICONS.LeaseContract
          });
        }
        break;

      case 'Unit':
        if (entity.building_id) {
          relations.push({
            type: 'Building',
            label: 'Gebäude',
            id: entity.building_id,
            name: entity.building_name,
            icon: ENTITY_ICONS.Building
          });
        }
        if (entity.id) {
          relations.push({
            type: 'LeaseContract',
            label: 'Mietverträge',
            count: entity.contract_count || 0,
            icon: ENTITY_ICONS.LeaseContract
          });
          relations.push({
            type: 'Invoice',
            label: 'Rechnungen',
            count: entity.invoice_count || 0,
            icon: ENTITY_ICONS.Invoice
          });
        }
        break;

      case 'LeaseContract':
        if (entity.unit_id) {
          relations.push({
            type: 'Unit',
            label: 'Einheit',
            id: entity.unit_id,
            name: entity.unit_number,
            icon: ENTITY_ICONS.Unit
          });
        }
        if (entity.tenant_id) {
          relations.push({
            type: 'Tenant',
            label: 'Mieter',
            id: entity.tenant_id,
            name: entity.tenant_name,
            icon: ENTITY_ICONS.Tenant
          });
        }
        if (entity.id) {
          relations.push({
            type: 'Invoice',
            label: 'Rechnungen',
            count: entity.invoice_count || 0,
            icon: ENTITY_ICONS.Invoice
          });
        }
        break;

      case 'Invoice':
        if (entity.building_id) {
          relations.push({
            type: 'Building',
            label: 'Gebäude',
            id: entity.building_id,
            name: entity.building_name,
            icon: ENTITY_ICONS.Building
          });
        }
        if (entity.contract_id) {
          relations.push({
            type: 'LeaseContract',
            label: 'Mietvertrag',
            id: entity.contract_id,
            name: entity.contract_number,
            icon: ENTITY_ICONS.LeaseContract
          });
        }
        if (entity.id) {
          relations.push({
            type: 'Payment',
            label: 'Zahlungen',
            count: entity.payment_count || 0,
            icon: ENTITY_ICONS.Payment
          });
        }
        break;

      default:
        break;
    }

    return relations;
  };

  const relations = getRelatedEntities();

  if (relations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Verknüpfungen
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {relations.map((relation, idx) => (
            <Link
              key={idx}
              to={
                relation.id
                  ? createPageUrl(`${relation.type}Detail`, { id: relation.id })
                  : createPageUrl(relation.type + 's')
              }
              className="group"
            >
              <div className={`p-3 rounded-lg transition-all cursor-pointer ${ENTITY_COLORS[relation.type]} group-hover:shadow-md`}>
                <div className="flex items-center gap-2 mb-1">
                  {relation.icon}
                  <span className="text-xs font-medium text-slate-700">
                    {relation.label}
                  </span>
                </div>
                {relation.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {relation.count}
                  </Badge>
                )}
                {relation.name && (
                  <p className="text-xs text-slate-600 truncate mt-1">
                    {relation.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}