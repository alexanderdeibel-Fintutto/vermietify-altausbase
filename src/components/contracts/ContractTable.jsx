import React from 'react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ContractTable({ contracts = [] }) {
  const navigate = useNavigate();

  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Mieter</th>
            <th>Einheit</th>
            <th>Kaltmiete</th>
            <th>Beginn</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id}>
              <td className="font-medium">{contract.tenant_name || 'Unbekannt'}</td>
              <td>{contract.unit_name || contract.unit_id}</td>
              <td>
                <CurrencyDisplay amount={contract.rent_cold || 0} />
              </td>
              <td>{contract.start_date ? new Date(contract.start_date).toLocaleDateString('de-DE') : '-'}</td>
              <td>
                <StatusBadge status={contract.status || 'active'} />
              </td>
              <td className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(createPageUrl('ContractDetail') + `?id=${contract.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}