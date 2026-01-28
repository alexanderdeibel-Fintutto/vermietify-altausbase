import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Mail, UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantPortalAccessButton({ tenant, unitId, buildingId }) {
  const queryClient = useQueryClient();
  
  // Prüfen ob bereits Einladung existiert
  const { data: invitations = [] } = useQuery({
    queryKey: ['tenant-invitation', tenant.email],
    queryFn: () => base44.entities.TenantInvitation.filter({ 
      tenant_email: tenant.email,
      unit_id: unitId
    }),
  });
  
  const activeInvitation = invitations.find(i => i.status === 'pending' || i.status === 'accepted');
  
  // Einladung erstellen
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const inviteCode = Math.random().toString(36).substring(2, 15);
      const inviteUrl = `https://mieterapp.fintutto.de/invite/${inviteCode}`;
      
      const invitation = await base44.entities.TenantInvitation.create({
        unit_id: unitId,
        building_id: buildingId,
        tenant_email: tenant.email,
        tenant_name: `${tenant.first_name} ${tenant.last_name}`,
        invite_code: inviteCode,
        invite_url: inviteUrl,
        invite_type: 'mieterapp',
        status: 'pending',
        access_level: 'full'
      });
      
      // E-Mail senden
      await base44.functions.invoke('sendTenantInvitation', {
        invitationId: invitation.id
      });
      
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-invitation'] });
      toast.success('Einladung versendet!');
    }
  });
  
  if (activeInvitation?.status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle className="w-3 h-3" />
          Aktiv in MieterApp
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(activeInvitation.invite_url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    );
  }
  
  if (activeInvitation?.status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-yellow-100 text-yellow-800">
          Eingeladen
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(activeInvitation.invite_url);
            toast.success('Link kopiert!');
          }}
        >
          Link kopieren
        </Button>
      </div>
    );
  }
  
  return (
    <Button
      onClick={() => createInviteMutation.mutate()}
      disabled={createInviteMutation.isPending}
      size="sm"
      className="gap-2"
    >
      {createInviteMutation.isPending ? (
        'Sende...'
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Zur MieterApp einladen
        </>
      )}
    </Button>
  );
}