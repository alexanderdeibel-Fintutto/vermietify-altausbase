import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutoFillButton({ buildingId, formType, sourceYear, onSuccess }) {
  const [filling, setFilling] = useState(false);

  const handleAutoFill = async () => {
    setFilling(true);
    try {
      const response = await base44.functions.invoke('autoFillNextYear', {
        building_id: buildingId,
        form_type: formType,
        source_year: sourceYear
      });

      if (response.data.success) {
        toast.success(`Formular für ${sourceYear + 1} vorausgefüllt`);
        onSuccess?.(response.data.submission);
      }
    } catch (error) {
      toast.error('Auto-Fill fehlgeschlagen: ' + error.message);
      console.error(error);
    } finally {
      setFilling(false);
    }
  };

  return (
    <Button
      onClick={handleAutoFill}
      disabled={filling}
      variant="outline"
      size="sm"
    >
      {filling ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      Für {sourceYear + 1} vorausfüllen
    </Button>
  );
}