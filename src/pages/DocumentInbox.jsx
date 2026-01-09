import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Search, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import InboxCard from '@/components/documentInbox/InboxCard';
import InboxEditSheet from '@/components/documentInbox/InboxEditSheet';

const DOCTYPE_ICONS = {
  invoice: '🧾',
  lease_contract: '📋',
  handover_protocol: '🔑',
  property_tax: '🏛️',
  insurance: '🛡️',
  bank_statement: '🏦',
  other: '📄',
  unknown: '❓'
};

const STATUS_COLORS = {
  processing: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  auto_matched: 'bg-green-100 text-green-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function DocumentInbox() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInbox, setSelectedInbox] = useState(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const queryClient = useQueryClient();

  const { data: inboxItems = [] } = useQuery({
    queryKey: ['documentInbox'],
    queryFn: async () => {
      const response = await base44.entities.DocumentInbox.list('-created_date', 100);
      return response || [];
    },
    refetchInterval: 5000
  });

  const filteredItems = inboxItems.filter(item => {
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    const typeMatch = filterType === 'all' || item.document_type === filterType;
    const searchMatch = !searchTerm || 
      item.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  const stats = {
    all: inboxItems.length,
    pending: inboxItems.filter(i => i.status === 'pending').length,
    auto_matched: inboxItems.filter(i => i.status === 'auto_matched').length,
    approved: inboxItems.filter(i => i.status === 'approved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📥 Dokumenten-Eingang</h1>
          <p className="text-slate-500 mt-1">Automatische Dokumentenerkennung und Zuordnung</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4" />
          Manuell hochladen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Gesamt</p>
            <p className="text-3xl font-bold text-slate-900">{stats.all}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Ausstehend</p>
            <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Auto-Zugeordnet</p>
            <p className="text-3xl font-bold text-green-700">{stats.auto_matched}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Erledigt</p>
            <p className="text-3xl font-bold text-emerald-700">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Dateiname, Lieferant, Mieter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Dokumenttyp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="invoice">🧾 Rechnung</SelectItem>
            <SelectItem value="lease_contract">📋 Mietvertrag</SelectItem>
            <SelectItem value="handover_protocol">🔑 Übergabeprotokoll</SelectItem>
            <SelectItem value="property_tax">🏛️ Grundsteuer</SelectItem>
            <SelectItem value="insurance">🛡️ Versicherung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="all">Alle ({stats.all})</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend ({stats.pending})</TabsTrigger>
          <TabsTrigger value="auto_matched">Auto-Zugeordnet ({stats.auto_matched})</TabsTrigger>
          <TabsTrigger value="approved">Erledigt ({stats.approved})</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="space-y-3 mt-6">
          {filteredItems.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Keine Dokumente gefunden</p>
            </Card>
          ) : (
            filteredItems.map(item => (
              <InboxCard
                key={item.id}
                item={item}
                onEdit={() => {
                  setSelectedInbox(item);
                  setShowEditSheet(true);
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Sheet */}
      {showEditSheet && selectedInbox && (
        <InboxEditSheet
          item={selectedInbox}
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          onSave={async () => {
            await queryClient.invalidateQueries({ queryKey: ['documentInbox'] });
            setShowEditSheet(false);
          }}
        />
      )}
    </div>
  );
}