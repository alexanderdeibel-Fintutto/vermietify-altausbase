import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import SmartProblemReportDialog from '@/components/testing/SmartProblemReportDialog';

export default function SmartProblemReportButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 shadow-lg gap-2"
        >
          <AlertCircle className="w-5 h-5" />
        </Button>
      </div>

      <SmartProblemReportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}