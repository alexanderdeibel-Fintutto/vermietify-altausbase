import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Wrench, Clock, CheckCircle, MessageSquare, Paperclip, Upload, X, Image } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Eingereicht', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  assigned: { label: 'Zugewiesen', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Bearbeitung', color: 'bg-purple-100 text-purple-800', icon: Wrench },
  completed: { label: 'Erledigt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Abgebrochen', color: 'bg-gray-100 text-gray-800', icon: Clock }
};

export default function MaintenanceRequestDetailDialog({ request, onClose, tenantId }) {
  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const queryClient = useQueryClient();

  const status = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const addCommentMutation = useMutation({
    mutationFn: async (comment) => {
      const currentNotes = request.notes || '';
      const timestamp = new Date().toLocaleString('de-DE');
      const updatedNotes = `${currentNotes}\n[${timestamp}] Mieter: ${comment}`;
      
      await base44.entities.MaintenanceTask.update(request.id, {
        notes: updatedNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-maintenance-requests']);
      setNewComment('');
      toast.success('Kommentar hinzugefügt');
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      setUploadingFile(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const currentAttachments = request.attachments || [];
      await base44.entities.MaintenanceTask.update(request.id, {
        attachments: [...currentAttachments, file_url]
      });
      
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-maintenance-requests']);
      setUploadingFile(false);
      toast.success('Datei hochgeladen');
    },
    onError: () => {
      setUploadingFile(false);
      toast.error('Upload fehlgeschlagen');
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

  const parseComments = (notes) => {
    if (!notes) return [];
    return notes.split('\n')
      .filter(line => line.trim().startsWith('['))
      .map(line => {
        const match = line.match(/\[(.*?)\] (.*?): (.*)/);
        if (match) {
          return {
            timestamp: match[1],
            author: match[2],
            text: match[3]
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const comments = parseComments(request.notes);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            {request.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <Badge className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          {/* Details */}
          <div>
            <h3 className="font-semibold mb-2">Beschreibung</h3>
            <p className="text-slate-600">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Kategorie</p>
              <p className="font-semibold">{request.category}</p>
            </div>
            <div>
              <p className="text-slate-600">Priorität</p>
              <p className="font-semibold capitalize">{request.priority || 'Normal'}</p>
            </div>
            <div>
              <p className="text-slate-600">Erstellt</p>
              <p className="font-semibold">{new Date(request.created_date).toLocaleDateString()}</p>
            </div>
            {request.scheduled_date && (
              <div>
                <p className="text-slate-600">Geplant</p>
                <p className="font-semibold">{new Date(request.scheduled_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Anhänge ({request.attachments.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {request.attachments.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded p-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-xs truncate">Datei {idx + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Kommentare
            </h3>
            
            {comments.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">Noch keine Kommentare</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((comment, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.author}</span>
                      <span className="text-xs text-slate-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            {request.status !== 'completed' && request.status !== 'cancelled' && (
              <div className="mt-4 space-y-2">
                <Textarea
                  placeholder="Kommentar hinzufügen..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => addCommentMutation.mutate(newComment)}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Kommentar hinzufügen
                </Button>
              </div>
            )}
          </div>

          {/* File Upload */}
          {request.status !== 'completed' && request.status !== 'cancelled' && (
            <div>
              <h3 className="font-semibold mb-2">Weitere Dateien hochladen</h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  disabled={uploadingFile}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload').click()}
                  disabled={uploadingFile}
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFile ? 'Wird hochgeladen...' : 'Datei hochladen'}
                </Button>
                <p className="text-xs text-slate-600">Bilder oder PDFs</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}