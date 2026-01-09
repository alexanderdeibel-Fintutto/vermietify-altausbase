import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import SmartProblemReportDialog from './SmartProblemReportDialog';
import { base44 } from '@/api/base44Client';

export default function SmartProblemReportButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testAccountId, setTestAccountId] = useState(null);

  useEffect(() => {
    const getTesterInfo = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const testAccounts = await base44.entities.TestAccount.filter(
            { tester_id: user.id },
            '-created_date',
            1
          );
          if (testAccounts[0]) {
            setTestAccountId(testAccounts[0].id);
          }
        }
      } catch (err) {
        console.error('Could not get tester info:', err);
      }
    };
    getTesterInfo();
  }, []);

  if (!testAccountId) return null;

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 shadow-lg gap-2"
          title="Problem melden 🐛"
        >
          <AlertCircle className="w-5 h-5" />
        </Button>
      </div>

      <SmartProblemReportDialog open={dialogOpen} onOpenChange={setDialogOpen} testAccountId={testAccountId} />
    </>
  );
}