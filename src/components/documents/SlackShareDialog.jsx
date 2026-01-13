import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SlackShareDialog({ open, onOpenChange, document }) {
  const [channel, setChannel] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    if (open) {
      loadChannels();
    }
  }, [open]);

  const loadChannels = async () => {
    setLoadingChannels(true);
    try {
      const accessToken = await (await fetch('/api/slack/getToken')).json();
      const res = await fetch('https://slack.com/api/conversations.list', {
        headers: { 'Authorization': `Bearer ${accessToken.token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const shareMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('sendDocumentToSlack', {
        document_id: document.id,
        channel: channel,
        message: message
      });
    },
    onSuccess: () => {
      toast.success(`Dokument zu ${channel} geteilt`);
      setChannel('');
      setMessage('');
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zu Slack teilen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Kanal</Label>
            <Input 
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="#general"
              list="slack-channels"
            />
            <datalist id="slack-channels">
              {channels.map(ch => (
                <option key={ch.id} value={`#${ch.name}`} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Nachricht (optional)</Label>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Weitere Nachricht hinzufügen..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => shareMutation.mutate()}
              disabled={!channel || shareMutation.isPending}
              className="gap-2"
            >
              {shareMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Teilen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}