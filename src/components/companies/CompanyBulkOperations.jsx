import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Download } from 'lucide-react';

export default function CompanyBulkOperations({ companies = [] }) {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Company.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setSelectedCompanies([]);
    }
  });

  const bulkExportMutation = useMutation({
    mutationFn: async (ids) => {
      const selectedComps = companies.filter(c => ids.includes(c.id));
      return base44.functions.invoke('exportCompaniesReport', {
        companies: selectedComps
      });
    },
    onSuccess: (data) => {
      window.open(data.data.file_url, '_blank');
    }
  });

  const toggleCompany = (companyId) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
    }
  };

  if (companies.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-base">Massenoperationen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Table */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <Checkbox
              checked={selectedCompanies.length === companies.length && companies.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium text-slate-700">
              {selectedCompanies.length} von {companies.length} ausgewählt
            </span>
          </div>

          {companies.map(company => (
            <div key={company.id} className="flex items-center gap-2 p-2 bg-white rounded border">
              <Checkbox
                checked={selectedCompanies.includes(company.id)}
                onCheckedChange={() => toggleCompany(company.id)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500">{company.legal_form}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {selectedCompanies.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkExportMutation.mutate(selectedCompanies)}
              disabled={bulkExportMutation.isPending}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-1" />
              Exportieren
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`${selectedCompanies.length} Unternehmen wirklich löschen?`)) {
                  bulkDeleteMutation.mutate(selectedCompanies);
                }
              }}
              disabled={bulkDeleteMutation.isPending}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Löschen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}