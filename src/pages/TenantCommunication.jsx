import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Mail, Volume2 } from 'lucide-react';
import SendMessageDialog from '@/components/tenant-communication/SendMessageDialog';
import SendAnnouncementDialog from '@/components/tenant-communication/SendAnnouncementDialog';
import CommunicationHistoryTable from '@/components/tenant-communication/CommunicationHistoryTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function TenantCommunicationPage() {
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const queryClient = useQueryClient();

  // Fetch data
  const { data: communications = [], isLoading: commsLoading } = useQuery({
    queryKey: ['tenantCommunications'],
    queryFn: () => base44.entities.TenantCommunication.list('-created_date', 100),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list('-updated_date', 100),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-updated_date', 50),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Create communication
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TenantCommunication.create({
      ...data,
      sender_email: currentUser?.email,
      status: 'sent'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantCommunications'] });
      setShowMessageDialog(false);
      setShowAnnouncementDialog(false);
    },
  });

  // Filter
  const filtered = useMemo(() => {
    return communications.filter(comm => {
      const matchesSearch = !searchQuery || 
        comm.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !filterType || comm.communication_type === filterType;

      return matchesSearch && matchesType;
    });
  }, [communications, searchQuery, filterType]);

  // Stats
  const stats = {
    total: communications.length,
    announcements: communications.filter(c => c.communication_type === 'announcement').length,
    individual: communications.filter(c => c.communication_type === 'individual_message').length,
    this_month: communications.filter(c => {
      const date = new Date(c.created_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  const buildingMap = buildings.reduce((acc, b) => {
    acc[b.id] = b;
    return acc;
  }, {});

  const tenantMap = tenants.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Mieter-Kommunikation</h1>
          <p className="text-slate-600 font-light mt-2">Senden Sie Ankündigungen und Nachrichten an Ihre Mieter</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowMessageDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
          >
            <Mail className="w-4 h-4" />
            Nachricht
          </Button>
          <Button
            onClick={() => setShowAnnouncementDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
          >
            <Volume2 className="w-4 h-4" />
            Ankündigung
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Insgesamt</p>
          <p className="text-2xl font-light text-slate-900 mt-1">📊 {stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Ankündigungen</p>
          <p className="text-2xl font-light text-blue-600 mt-1">📢 {stats.announcements}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Einzelnachrichten</p>
          <p className="text-2xl font-light text-green-600 mt-1">💬 {stats.individual}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600">Diesen Monat</p>
          <p className="text-2xl font-light text-purple-600 mt-1">📅 {stats.this_month}</p>
        </Card>
      </div>

      {/* Dialogs */}
      {currentUser && (
        <>
          <SendMessageDialog
            open={showMessageDialog}
            onOpenChange={setShowMessageDialog}
            tenants={tenants}
            onSend={(data) => createMutation.mutate(data)}
          />
          <SendAnnouncementDialog
            open={showAnnouncementDialog}
            onOpenChange={setShowAnnouncementDialog}
            buildings={buildings}
            onSend={(data) => createMutation.mutate(data)}
          />
        </>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Nach Betreff oder Inhalt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-light"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Typen</SelectItem>
              <SelectItem value="announcement">📢 Ankündigung</SelectItem>
              <SelectItem value="individual_message">💬 Einzelnachricht</SelectItem>
              <SelectItem value="notification">🔔 Benachrichtigung</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-lg font-light text-slate-900 mb-3">Kommunikationsverlauf</h2>
        <CommunicationHistoryTable
          communications={filtered}
          tenants={tenantMap}
          buildings={buildingMap}
        />
      </div>
    </div>
  );
}