import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

export default function BroadcastMessageDialog({ onClose, senderEmail }) {
  const [targetType, setTargetType] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sendEmail, setSendEmail] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 200)
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(null, 500)
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, null, 500)
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data) => {
      let recipients = [];

      if (data.targetType === 'all') {
        recipients = tenants.map(t => t.email);
      } else if (data.targetType === 'building') {
        const buildingContracts = contracts.filter(c => c.building_id === data.selectedBuilding);
        const tenantIds = [...new Set(buildingContracts.map(c => c.tenant_id))];
        recipients = tenants.filter(t => tenantIds.includes(t.id)).map(t => t.email);
      }

      // Create notification for each recipient
      const notifications = recipients.map(recipientEmail => ({
        user_email: recipientEmail,
        title: data.title,
        message: data.message,
        type: 'system',
        priority: data.priority,
        is_read: false,
        sent_via_email: data.sendEmail,
        sent_via_push: data.sendPush
      }));

      await base44.entities.Notification.bulkCreate(notifications);

      // Create announcement post
      await base44.entities.BuildingBoardPost.create({
        building_id: data.targetType === 'building' ? data.selectedBuilding : '',
        author_email: senderEmail,
        author_name: 'Verwaltung',
        author_type: 'admin',
        title: data.title,
        content: data.message,
        post_type: 'announcement',
        priority: data.priority === 'urgent' ? 'urgent' : data.priority === 'high' ? 'high' : 'normal',
        is_pinned: data.priority === 'urgent',
        is_published: true,
        published_at: new Date().toISOString()
      });

      return { count: recipients.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tenantNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['buildingAnnouncements'] });
      toast.success(`Broadcast an ${result.count} Empfänger gesendet`);
      onClose();
    }
  });

  const handleSend = () => {
    if (!title || !message) {
      toast.error('Bitte Titel und Nachricht eingeben');
      return;
    }
    if (targetType === 'building' && !selectedBuilding) {
      toast.error('Bitte Gebäude auswählen');
      return;
    }
    broadcastMutation.mutate({ 
      targetType, 
      selectedBuilding, 
      title, 
      message, 
      priority,
      sendEmail,
      sendPush
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Broadcast-Nachricht
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Zielgruppe</Label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mieter</SelectItem>
                <SelectItem value="building">Mieter eines Gebäudes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === 'building' && (
            <div>
              <Label>Gebäude</Label>
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(building => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name} - {building.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Priorität</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Titel</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel der Ankündigung"
            />
          </div>

          <div>
            <Label>Nachricht</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ihre Nachricht an alle Mieter..."
              rows={8}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Versandoptionen</Label>
            <div className="flex items-center gap-2">
              <Switch checked={sendPush} onCheckedChange={setSendPush} />
              <Label>Push-Benachrichtigung senden</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              <Label>Zusätzlich per E-Mail senden</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleSend} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={broadcastMutation.isPending}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {broadcastMutation.isPending ? 'Wird gesendet...' : 'Broadcast senden'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}