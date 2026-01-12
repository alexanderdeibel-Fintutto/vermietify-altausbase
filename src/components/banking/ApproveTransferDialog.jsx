import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function ApproveTransferDialog({ open, onOpenChange, transfer }) {
  if (!transfer) return null;

  const handleApprove = async () => {
    try {
      await base44.entities.BankTransfer.update(transfer.id, {
        status: "approved",
        approved_by_email: "current_user@example.com" // TODO: get from auth
      });
      toast.success("Überweisung freigegeben");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReject = async () => {
    try {
      await base44.entities.BankTransfer.update(transfer.id, {
        status: "cancelled"
      });
      toast.success("Überweisung storniert");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Überweisung freigeben</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-gray-50 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Empfänger:</span>
              <span className="font-semibold">{transfer.recipient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IBAN:</span>
              <span className="font-mono text-sm">{transfer.recipient_iban.slice(0, 8)}****{transfer.recipient_iban.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Betrag:</span>
              <span className="font-semibold">{transfer.amount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verwendungszweck:</span>
              <span className="text-sm text-right">{transfer.purpose}</span>
            </div>
          </Card>

          <div className="bg-blue-50 p-3 rounded-lg flex gap-2 border-l-4 border-blue-400">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">Sie sind im Begriff, diese Überweisung freizugeben.</p>
              <p>Bitte überprüfen Sie alle Details sorgfältig.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReject}>Ablehnen</Button>
          <Button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700">Freigeben & TAN anfordern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}