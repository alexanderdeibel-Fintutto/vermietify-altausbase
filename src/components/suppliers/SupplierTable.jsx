import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Mail, Phone } from 'lucide-react';

export default function SupplierTable({ suppliers = [], onView }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Kategorie</th>
            <th>Kontakt</th>
            <th>Offene Rechnungen</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="font-medium">{supplier.name}</td>
              <td>{supplier.category || 'Allgemein'}</td>
              <td>
                <div className="space-y-1">
                  {supplier.email && (
                    <div className="flex items-center gap-1 text-xs">
                      <Mail className="h-3 w-3" />
                      {supplier.email}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-1 text-xs">
                      <Phone className="h-3 w-3" />
                      {supplier.phone}
                    </div>
                  )}
                </div>
              </td>
              <td>{supplier.open_invoices || 0}</td>
              <td className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(supplier)}>
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