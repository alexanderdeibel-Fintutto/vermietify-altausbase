import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Trash2, Edit2, Mail, Phone } from 'lucide-react';
import EmployeeFormDialog from '@/components/companies/EmployeeFormDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const allCompanies = await base44.entities.Company.list();
      const allEmployees = [];
      allCompanies.forEach(company => {
        (company.contacts || []).forEach(contact => {
          allEmployees.push({
            ...contact,
            company_id: company.id,
            company_name: company.name
          });
        });
      });
      return allEmployees;
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employee) => {
      const company = await base44.entities.Company.filter({ id: employee.company_id });
      if (company.length > 0) {
        const updatedContacts = company[0].contacts.filter(c => c.id !== employee.id);
        await base44.entities.Company.update(employee.company_id, { contacts: updatedContacts });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || emp.company_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  if (isLoading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mitarbeiterverwaltung</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie alle Ihre Mitarbeiter und Kontakte</p>
        </div>
        <Button onClick={() => { setEditingEmployee(null); setFormDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Nach Name, E-Mail suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Unternehmen</SelectItem>
            {companies.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamt</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Geschäftsführer</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {employees.filter(e => e.role === 'Geschäftsführer').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Mitarbeiter</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {employees.filter(e => e.role === 'Mitarbeiter').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Mit E-Mail</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {employees.filter(e => e.email).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mitarbeiterliste</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Keine Mitarbeiter gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Rolle</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Unternehmen</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Kontakt</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{emp.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">{emp.role}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">{emp.company_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {emp.email && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Mail className="w-3 h-3" />
                              <a href={`mailto:${emp.email}`} className="hover:text-blue-600">
                                {emp.email}
                              </a>
                            </div>
                          )}
                          {emp.phone && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${emp.phone}`} className="hover:text-blue-600">
                                {emp.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`${emp.name} wirklich löschen?`)) {
                              deleteEmployeeMutation.mutate(emp);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <EmployeeFormDialog
        isOpen={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        companies={companies}
        editingEmployee={editingEmployee}
      />
    </div>
  );
}