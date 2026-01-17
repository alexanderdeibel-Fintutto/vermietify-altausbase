import React from 'react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { Eye, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantTable({ tenants = [] }) {
  const navigate = useNavigate();

  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>E-Mail</th>
            <th>Telefon</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="vf-data-table-row-clickable">
              <td className="font-medium">{tenant.name}</td>
              <td>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-[var(--theme-text-muted)]" />
                  {tenant.email}
                </div>
              </td>
              <td>
                {tenant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-[var(--theme-text-muted)]" />
                    {tenant.phone}
                  </div>
                )}
              </td>
              <td>
                <StatusBadge status={tenant.status || 'active'} />
              </td>
              <td className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(createPageUrl('TenantDetail') + `?id=${tenant.id}`)}
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