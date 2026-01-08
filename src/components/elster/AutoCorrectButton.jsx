import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutoCorrectButton({ submissionId, onSuccess }) {
  const [correcting, setCorrecting] = useState(false);

  const handleAutoCorrect = async () => {
    setCorrecting(true);
    try {
      const response = await base44.functions.invoke('autoCorrectElsterErrors', {
        submission_id: submissionId
      });

      if (response.data.success) {
        const corrected = response.data.applied_corrections?.length || 0;
        const remaining = response.data.remaining_errors || 0;
        
        toast.success(`${corrected} Fehler korrigiert, ${remaining} verbleibend`);
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Auto-Korrektur fehlgeschlagen');
      console.error(error);
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <Button 
      onClick={handleAutoCorrect} 
      disabled={correcting}
      className="flex-1"
    >
      {correcting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Korrigiere...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          KI-Auto-Korrektur
        </>
      )}
    </Button>
  );
}