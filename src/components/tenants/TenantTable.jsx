import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Eye, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TenantTable({ tenants, onEdit, onDelete, onSelectionChange }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const navigate = useNavigate();

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(tenants.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
    onSelectionChange?.(checked ? new Set(tenants.map(t => t.id)) : new Set());
  };

  const handleSelectTenant = (tenantId, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(tenantId);
    } else {
      newSelected.delete(tenantId);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(newSelected);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktiv' },
      inactive: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Inaktiv' },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={`${variant.bg} ${variant.text}`}>{variant.label}</Badge>;
  };

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left w-10">
              <Checkbox
                checked={selectedIds.size === tenants.length && tenants.length > 0}
                onChange={(checked) => handleSelectAll(checked)}
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Portal</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Seit</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {tenants.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                Keine Mieter gefunden
              </td>
            </tr>
          ) : (
            tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(tenant.id)}
                    onChange={(checked) => handleSelectTenant(tenant.id, checked)}
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {tenant.full_name || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {tenant.email}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getStatusBadge(tenant.status || 'active')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    variant={tenant.portal_enabled ? 'default' : 'outline'}
                    className={tenant.portal_enabled ? 'bg-blue-100 text-blue-800' : ''}
                  >
                    {tenant.portal_enabled ? '✓ Aktiv' : 'Inaktiv'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {tenant.created_date
                    ? new Date(tenant.created_date).toLocaleDateString('de-DE')
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(createPageUrl('TenantDetail') + `?id=${tenant.id}`)}
                      title="Details ansehen"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tenant)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(tenant)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}