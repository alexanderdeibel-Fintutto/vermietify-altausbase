import React, { useState } from 'react';
import { VfListPage, VfListPageHeader } from '@/components/list-pages/VfListPage';
import { VfFilterBar } from '@/components/list-pages/VfFilterBar';
import { VfDataTable } from '@/components/list-pages/VfDataTable';
import { VfBulkActionsBar } from '@/components/list-pages/VfBulkActionsBar';
import { VfPagination } from '@/components/list-pages/VfPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Mail, Trash2 } from 'lucide-react';

export default function ListPageExample() {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Mock data
  const mockData = Array.from({ length: 45 }, (_, i) => ({
    id: i + 1,
    name: `Gebäude ${i + 1}`,
    address: `Musterstraße ${i + 1}, 12345 Stadt`,
    units: Math.floor(Math.random() * 20) + 5,
    revenue: (Math.random() * 50000 + 10000).toFixed(2),
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'inactive'
  }));

  const filteredData = mockData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         item.address.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { 
      key: 'name', 
      label: 'Gebäude', 
      sortable: true 
    },
    { 
      key: 'address', 
      label: 'Adresse', 
      sortable: true 
    },
    { 
      key: 'units', 
      label: 'Einheiten', 
      type: 'number',
      sortable: true 
    },
    { 
      key: 'revenue', 
      label: 'Einnahmen', 
      type: 'currency',
      render: (value) => `${parseFloat(value).toLocaleString('de-DE')} €`
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'default'}>
          {value === 'active' ? 'Aktiv' : value === 'pending' ? 'Ausstehend' : 'Inaktiv'}
        </Badge>
      )
    }
  ];

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(paginatedData.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const activeFilters = [
    statusFilter !== 'all' && { 
      label: `Status: ${statusFilter}`, 
      key: 'status' 
    }
  ].filter(Boolean);

  return (
    <VfListPage
      header={
        <VfListPageHeader
          title="Gebäudeverwaltung"
          description="Verwalten Sie alle Ihre Immobilien an einem Ort"
          actions={
            <>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Neues Gebäude
              </Button>
            </>
          }
        />
      }
      filterBar={
        <VfFilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Gebäude oder Adresse suchen..."
          filters={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          }
          activeFilters={activeFilters}
          onRemoveFilter={(filter) => {
            if (filter.key === 'status') setStatusFilter('all');
          }}
        />
      }
      bulkActions={
        <VfBulkActionsBar
          selectedCount={selectedRows.length}
          onClear={() => setSelectedRows([])}
          actions={
            <>
              <button className="vf-bulk-action-btn">
                <Mail className="h-4 w-4 mr-2 inline" />
                E-Mail senden
              </button>
              <button className="vf-bulk-action-btn vf-bulk-action-btn-destructive">
                <Trash2 className="h-4 w-4 mr-2 inline" />
                Löschen
              </button>
            </>
          }
        />
      }
    >
      <VfDataTable
        columns={columns}
        data={paginatedData}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(key) => {
          if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(key);
            setSortDirection('asc');
          }
        }}
        selectable
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        onRowClick={(row) => console.log('Row clicked:', row)}
      />

      <VfPagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredData.length / pageSize)}
        pageSize={pageSize}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </VfListPage>
  );
}