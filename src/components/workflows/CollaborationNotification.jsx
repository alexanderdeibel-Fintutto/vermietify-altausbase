import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Bell, Users, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function CollaborationNotification({ workflowId, companyId }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['workflow-notifications', workflowId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.Notification.filter({
        related_entity_id: workflowId
      }, '-created_date', 5);
      return result;
    },
    refetchInterval: 10000
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['workflow-comments', workflowId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowComment.filter({
        workflow_id: workflowId
      }, '-created_date', 1);
      return result;
    },
    refetchInterval: 15000
  });

  useEffect(() => {
    notifications.forEach(notif => {
      if (!notif.is_read && notif.priority === 'high') {
        toast.info(
          `${notif.message}`,
          {
            duration: 5000,
            icon: <Bell className="w-4 h-4" />
          }
        );
      }
    });
  }, [notifications]);

  useEffect(() => {
    comments.forEach(comment => {
      if (comment.type === 'approval' || comment.type === 'suggestion') {
        const icon = comment.type === 'approval' 
          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
          : <MessageSquare className="w-4 h-4 text-blue-600" />;
        
        toast.info(
          `Neuer ${comment.type === 'approval' ? 'Genehmigung' : 'Vorschlag'} von ${comment.author_email}`,
          {
            duration: 6000,
            icon
          }
        );
      }
    });
  }, [comments]);

  return null;
}