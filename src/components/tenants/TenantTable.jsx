import React from 'react';
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TenantTable({ tenants, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefon</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {tenants?.map((tenant, idx) => (
            <tr 
              key={idx}
              className="border-b border-slate-100 hover:bg-green-50 transition-colors cursor-pointer"
              onClick={() => onEdit?.(tenant)}
            >
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{tenant.full_name}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{tenant.email}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{tenant.phone || '—'}</td>
              <td className="px-6 py-4 text-sm">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Aktiv
                </span>
              </td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(tenant);
                  }}
                >
                  <Pencil className="w-4 h-4 text-slate-600" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(tenant);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}