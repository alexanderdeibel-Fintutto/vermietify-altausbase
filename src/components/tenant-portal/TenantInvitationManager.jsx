import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { generateTenantInvitation, sendInvitationEmail } from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Check, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantInvitationManager({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [tenantEmail, setTenantEmail] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [inviteType, setInviteType] = useState('mieterapp');
  const [copiedId, setCopiedId] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Units laden
  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: async () => {
      let query = supabase.from('v_units_with_lease').select('*');
      if (buildingId) {
        query = query.eq('gebaeude_id', buildingId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  
  // Invitations laden
  const { data: invitations = [] } = useQuery({
    queryKey: ['tenant-invitations', buildingId],
    queryFn: async () => {
      let query = supabase.from('TenantInvitation').select('*');
      if (buildingId) {
        query = query.eq('building_id', buildingId);
      }
      query = query.order('created_date', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  
  // Invitation erstellen
  const createMutation = useMutation({
    mutationFn: async () => {
      const unit = units.find(u => u.id === selectedUnitId);
      const result = await generateTenantInvitation(
        tenantEmail, 
        selectedUnitId, 
        unit?.gebaeude_id || buildingId,
        inviteType
      );
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
        toast.success('Einladung erstellt!');
        setShowForm(false);
        setTenantEmail('');
        setSelectedUnitId('');
      } else {
        toast.error(result.error);
      }
    }
  });
  
  // E-Mail senden
  const sendEmailMutation = useMutation({
    mutationFn: sendInvitationEmail,
    onSuccess: () => {
      toast.success('Einladungs-E-Mail versendet!');
    }
  });
  
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Link kopiert!');
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mieter-Einladungen</h2>
          <p className="text-sm text-gray-600">Mieter zur MieterApp einladen</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Einladung
        </Button>
      </div>
      
      {/* Formular */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Mieter einladen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Einheit</label>
                <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Einheit auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.wohnflaeche_qm}m²
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Mieter E-Mail</label>
                <Input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="mieter@example.com"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Einladungstyp</label>
                <Select value={inviteType} onValueChange={setInviteType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mieterapp">MieterApp (empfohlen)</SelectItem>
                    <SelectItem value="portal">Web-Portal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!tenantEmail || !selectedUnitId || createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? 'Erstelle...' : 'Einladung erstellen'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Invitations Liste */}
      <div className="space-y-3">
        {invitations.map(inv => (
          <Card key={inv.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{inv.tenant_email}</h4>
                    <Badge className={getStatusColor(inv.status)}>
                      {inv.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Einheit: {inv.unit_id} · Typ: {inv.invite_type}
                  </p>
                  
                  {inv.status === 'pending' && inv.invite_url && (
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                      <code className="text-xs flex-1 truncate">{inv.invite_url}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(inv.invite_url, inv.id)}
                      >
                        {copiedId === inv.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(inv.invite_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {inv.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendEmailMutation.mutate(inv.id)}
                    disabled={sendEmailMutation.isPending}
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    E-Mail senden
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                Erstellt: {new Date(inv.created_date).toLocaleDateString('de-DE')}
                {inv.accepted_at && (
                  <> · Akzeptiert: {new Date(inv.accepted_at).toLocaleDateString('de-DE')}</>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}