import React from 'react';
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TenantTable({ tenants, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border border-slate-100 overflow-hidden shadow-none">
      <table className="w-full">
        <thead>
          <tr className="bg-white border-b border-slate-100">
            <th className="px-6 py-3 text-left text-xs font-extralight text-slate-400">Name</th>
            <th className="px-6 py-3 text-left text-xs font-extralight text-slate-400">Email</th>
            <th className="px-6 py-3 text-left text-xs font-extralight text-slate-400">Telefon</th>
            <th className="px-6 py-3 text-left text-xs font-extralight text-slate-400">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {tenants?.map((tenant, idx) => (
            <tr 
              key={idx}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => onEdit?.(tenant)}
            >
              <td className="px-6 py-3 text-sm font-extralight text-slate-700">{tenant.full_name}</td>
              <td className="px-6 py-3 text-sm font-extralight text-slate-500">{tenant.email}</td>
              <td className="px-6 py-3 text-sm font-extralight text-slate-500">{tenant.phone || '—'}</td>
              <td className="px-6 py-3 text-sm">
                <span className="px-2 py-1 rounded-full text-xs font-extralight bg-slate-100 text-slate-600">
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