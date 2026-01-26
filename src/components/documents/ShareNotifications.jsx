import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Bell, Check } from 'lucide-react';

export default function ShareNotifications() {
  const [isNotifying, setIsNotifying] = React.useState(false);

  const notifyMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await base44.functions.invoke('sendShareNotification', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Benachrichtigung gesendet', {
        description: `Email an ${data.email} versendet`,
        icon: <Check className="w-4 h-4" />
      });
    },
    onError: () => {
      toast.error('Fehler beim Versenden der Benachrichtigung');
    }
  });

  return {
    notify: (documentTitle, sharedWithEmail, accessLevel) => {
      setIsNotifying(true);
      notifyMutation.mutate({
        document_title: documentTitle,
        shared_with_email: sharedWithEmail,
        access_level: accessLevel
      }, {
        onSettled: () => setIsNotifying(false)
      });
    },
    isLoading: isNotifying
  };
}