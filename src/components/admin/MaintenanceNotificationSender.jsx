import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceNotificationSender() {
  const [formData, setFormData] = useState({
    notification_type: 'maintenance',
    title: '',
    message: '',
    urgency: 'normal',
    recipient_type: 'all'
  });
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('sendMaintenanceNotification', data);
    },
    onSuccess: (response) => {
      toast.success(`Benachrichtigung an ${response.data.recipients_count} Mieter gesendet`);
      setFormData({
        notification_type: 'maintenance',
        title: '',
        message: '',
        urgency: 'normal',
        recipient_type: 'all'
      });
      setSelectedTenants([]);
      setSelectedBuilding('');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const handleSend = () => {
    if (!formData.title || !formData.message) {
      toast.error('Bitte Titel und Nachricht eingeben');
      return;
    }

    const payload = {
      ...formData,
      tenant_ids: formData.recipient_type === 'specific' ? selectedTenants : undefined,
      building_id: formData.recipient_type === 'building' ? selectedBuilding : undefined
    };

    sendNotificationMutation.mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Mieter-Benachrichtigung senden
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Benachrichtigungstyp</Label>
          <Select
            value={formData.notification_type}
            onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maintenance">Wartung</SelectItem>
              <SelectItem value="emergency">Notfall</SelectItem>
              <SelectItem value="general">Allgemein</SelectItem>
              <SelectItem value="building_update">Gebäude-Update</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Empfänger</Label>
          <Select
            value={formData.recipient_type}
            onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Mieter</SelectItem>
              <SelectItem value="building">Gebäude</SelectItem>
              <SelectItem value="specific">Spezifische Mieter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.recipient_type === 'building' && (
          <div>
            <Label>Gebäude auswählen</Label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger>
                <SelectValue placeholder="Gebäude wählen..." />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name || b.address}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Dringlichkeit</Label>
          <Select
            value={formData.urgency}
            onValueChange={(value) => setFormData({ ...formData, urgency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgent">Dringend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Titel</Label>
          <Input
            placeholder="z.B. Geplante Wartungsarbeiten"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <Label>Nachricht</Label>
          <Textarea
            placeholder="Beschreiben Sie die Wartungsarbeiten oder wichtige Updates..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="min-h-32"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={sendNotificationMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-4 h-4 mr-2" />
          Benachrichtigung senden
        </Button>
      </CardContent>
    </Card>
  );
}