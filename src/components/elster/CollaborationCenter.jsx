import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function CollaborationCenter({ submissionId }) {
  const [showShare, setShowShare] = useState(false);
  const [emails, setEmails] = useState('');
  const [sharing, setSharing] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const handleShare = async () => {
    if (!emails.trim()) {
      toast.error('Bitte E-Mails eingeben');
      return;
    }

    setSharing(true);
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
      
      const response = await base44.functions.invoke('shareSubmissionWithTeam', {
        submission_id: submissionId,
        user_emails: emailList,
        access_level: 'view'
      });

      toast.success(`Mit ${response.data.shared_with.length} Personen geteilt`);
      setEmails('');
      setShowShare(false);
    } catch (error) {
      toast.error('Fehler beim Teilen');
    } finally {
      setSharing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      text: newComment,
      user: 'Du',
      timestamp: new Date().toLocaleTimeString('de-DE')
    };

    setComments([...comments, comment]);
    setNewComment('');
    toast.success('Kommentar hinzugefügt');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team-Zusammenarbeit</span>
            <Button size="sm" onClick={() => setShowShare(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Teilen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Kommentar hinzufügen..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment} size="sm">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Keine Kommentare</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="p-2 bg-slate-50 rounded text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{comment.user}</span>
                    <span className="text-xs text-slate-600">{comment.timestamp}</span>
                  </div>
                  <p className="text-slate-700 mt-1">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mit Team-Mitgliedern teilen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-Mail-Adressen (kommagetrennt)</label>
              <Input
                placeholder="name@example.com, other@example.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleShare} disabled={sharing} className="w-full">
              {sharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird geteilt...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Teilen
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}