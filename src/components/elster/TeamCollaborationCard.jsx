import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TeamCollaborationCard({ submissionId }) {
  const [emails, setEmails] = useState('');
  const [permission, setPermission] = useState('view');
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    
    if (emailList.length === 0) {
      toast.error('Bitte E-Mail-Adressen eingeben');
      return;
    }

    setSharing(true);
    try {
      const response = await base44.functions.invoke('shareSubmissionWithTeam', {
        submission_id: submissionId,
        user_emails: emailList,
        permission_level: permission,
        message
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setEmails('');
        setMessage('');
      }
    } catch (error) {
      toast.error('Teilen fehlgeschlagen');
      console.error(error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Mit Team teilen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">E-Mail-Adressen (kommagetrennt)</Label>
          <Input
            placeholder="user1@example.com, user2@example.com"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Berechtigung</Label>
          <Select value={permission} onValueChange={setPermission}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">Ansehen</SelectItem>
              <SelectItem value="edit">Bearbeiten</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Nachricht (optional)</Label>
          <Textarea
            placeholder="Optionale Nachricht..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={handleShare} disabled={sharing} className="w-full">
          {sharing ? 'Teile...' : 'Teilen'}
        </Button>
      </CardContent>
    </Card>
  );
}