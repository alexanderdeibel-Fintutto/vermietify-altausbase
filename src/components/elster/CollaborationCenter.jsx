import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, MessageSquare, Share2, UserPlus, 
  CheckCircle, Clock, Eye, Edit3 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CollaborationCenter({ submissionId }) {
  const [comments, setComments] = useState([
    {
      id: '1',
      user: 'Max Mustermann',
      role: 'Eigentümer',
      message: 'Bitte die Instandhaltungskosten für Dach noch hinzufügen',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'open'
    },
    {
      id: '2',
      user: 'Steuerberater Schmidt',
      role: 'Steuerberater',
      message: 'Die AfA-Berechnung sieht korrekt aus. Kann so eingereicht werden.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'resolved'
    }
  ]);

  const [collaborators, setCollaborators] = useState([
    {
      id: '1',
      name: 'Max Mustermann',
      email: 'max@example.com',
      role: 'owner',
      permissions: ['read', 'write', 'submit']
    },
    {
      id: '2',
      name: 'Steuerberater Schmidt',
      email: 'schmidt@steuerberater.de',
      role: 'advisor',
      permissions: ['read', 'comment']
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      user: 'Sie',
      role: 'Eigentümer',
      message: newComment,
      timestamp: new Date().toISOString(),
      status: 'open'
    };

    setComments([comment, ...comments]);
    setNewComment('');

    try {
      await base44.functions.invoke('addSubmissionComment', {
        submission_id: submissionId,
        message: newComment
      });
      toast.success('Kommentar hinzugefügt');
    } catch (error) {
      toast.error('Kommentar konnte nicht gespeichert werden');
    }
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await base44.functions.invoke('inviteCollaborator', {
        submission_id: submissionId,
        email: inviteEmail,
        role: inviteRole
      });

      toast.success(`Einladung an ${inviteEmail} gesendet`);
      setShowInviteDialog(false);
      setInviteEmail('');
    } catch (error) {
      toast.error('Einladung fehlgeschlagen');
    }
  };

  const handleResolveComment = (commentId) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, status: 'resolved' } : c
    ));
    toast.success('Kommentar als erledigt markiert');
  };

  const roleLabels = {
    owner: 'Eigentümer',
    advisor: 'Steuerberater',
    viewer: 'Betrachter',
    editor: 'Bearbeiter'
  };

  const roleColors = {
    owner: 'bg-blue-100 text-blue-800',
    advisor: 'bg-purple-100 text-purple-800',
    viewer: 'bg-slate-100 text-slate-800',
    editor: 'bg-green-100 text-green-800'
  };

  return (
    <div className="space-y-6">
      {/* Collaborators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team-Mitglieder
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Einladen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {collaborators.map(collab => (
              <div key={collab.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {collab.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{collab.name}</div>
                    <div className="text-xs text-slate-600">{collab.email}</div>
                  </div>
                </div>
                <Badge className={roleColors[collab.role]}>
                  {roleLabels[collab.role]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Diskussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Kommentar hinzufügen..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Kommentar hinzufügen
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map(comment => (
              <div
                key={comment.id}
                className={`p-3 border rounded-lg ${
                  comment.status === 'resolved' ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-700">
                        {comment.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{comment.user}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(comment.timestamp).toLocaleString('de-DE')}
                      </div>
                    </div>
                  </div>
                  {comment.status === 'open' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveComment(comment.id)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Erledigt
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Erledigt
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700">{comment.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { action: 'Formular erstellt', user: 'Max Mustermann', time: '2 Stunden', icon: Edit3 },
              { action: 'Zur Prüfung freigegeben', user: 'Max Mustermann', time: '1 Stunde', icon: Share2 },
              { action: 'Kommentar hinzugefügt', user: 'Steuerberater Schmidt', time: '30 Minuten', icon: MessageSquare },
              { action: 'Änderungen vorgenommen', user: 'Max Mustermann', time: '10 Minuten', icon: Edit3 }
            ].map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-2 text-sm">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-slate-600"> {activity.action}</span>
                  </div>
                  <span className="text-xs text-slate-500">vor {activity.time}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team-Mitglied einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">E-Mail-Adresse</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rolle</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="viewer">Betrachter (nur lesen)</option>
                <option value="editor">Bearbeiter (lesen + bearbeiten)</option>
                <option value="advisor">Steuerberater (lesen + kommentieren)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInviteCollaborator}
                disabled={!inviteEmail.trim()}
                className="flex-1"
              >
                Einladung senden
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}