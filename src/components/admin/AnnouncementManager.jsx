import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Send, Clock } from 'lucide-react';

export default function AnnouncementManager({ companyId }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [targetAudience, setTargetAudience] = useState('all_tenants');
  const [buildingId, setBuildingId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements', companyId],
    queryFn: () => base44.entities.Announcement.filter({ company_id: companyId }, '-published_at', 10)
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('publishAnnouncement', {
        company_id: companyId,
        title,
        message,
        announcement_type: type,
        target_audience: targetAudience,
        building_id: targetAudience === 'specific_building' ? buildingId : null,
        priority,
        send_push: sendPush,
        send_email: sendEmail
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTitle('');
      setMessage('');
      setType('general');
      setTargetAudience('all_tenants');
      setBuildingId('');
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Neue Ankündigung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Titel der Ankündigung"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Nachricht an Mieter..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-2 block">Typ</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Allgemein</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="rule_change">Regeländerung</SelectItem>
                  <SelectItem value="emergency">Notfall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm mb-2 block">Priorität</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm mb-2 block">Zielgruppe</label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tenants">Alle Mieter</SelectItem>
                <SelectItem value="specific_building">Bestimmtes Gebäude</SelectItem>
              </SelectContent>
            </Select>
            {targetAudience === 'specific_building' && (
              <Input
                className="mt-2"
                placeholder="Gebäude-ID"
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Push-Benachrichtigung senden</span>
              <Switch checked={sendPush} onCheckedChange={setSendPush} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">E-Mail senden</span>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
          </div>

          <Button
            onClick={() => publishMutation.mutate()}
            disabled={!title || !message || publishMutation.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Ankündigung veröffentlichen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kürzlich veröffentlicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {announcements.map(ann => (
            <div key={ann.id} className="p-3 border rounded">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{ann.title}</h4>
                <Badge className={
                  ann.priority === 'high' ? 'bg-red-100 text-red-800' :
                  ann.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                  'bg-slate-100 text-slate-800'
                }>
                  {ann.priority}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">{ann.message}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {new Date(ann.published_at || ann.created_date).toLocaleString('de-DE')}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}