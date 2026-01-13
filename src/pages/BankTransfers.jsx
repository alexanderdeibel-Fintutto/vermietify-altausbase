import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Send } from "lucide-react";
import CreateTransferDialog from "@/components/banking/CreateTransferDialog";
import ApproveTransferDialog from "@/components/banking/ApproveTransferDialog";
import TanInputDialog from "@/components/banking/TanInputDialog";
import TransferStatusBadge from "@/components/banking/TransferStatusBadge";
import BankTransactionMatcher from "@/components/banking/BankTransactionMatcher";
import { toast } from "sonner";

export default function BankTransfersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [tanOpen, setTanOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: transfers = [] } = useQuery({
    queryKey: ["bank_transfers"],
    queryFn: () => base44.entities.BankTransfer.list('-created_date', 100)
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice?.list?.() || []
  });

  const filteredTransfers = transfers.filter(t => 
    filterStatus === "all" || t.status === filterStatus
  );

  const handleInitiateTransfer = async (transfer) => {
    if (transfer.status !== "approved") {
      toast.error("Überweisung muss zuerst genehmigt sein");
      return;
    }

    try {
      const response = await base44.functions.invoke('finapiInitiateTransfer', {
        bank_transfer_id: transfer.id,
        bank_account_id: transfer.bank_account_id
      });

      if (response.data.success) {
        setSelectedTransfer({ ...transfer, ...response.data });
        if (response.data.tan_required) {
          setTanOpen(true);
        } else {
          toast.success("Überweisung ausgeführt!");
          queryClient.invalidateQueries({ queryKey: ["bank_transfers"] });
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Überweisungen</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie ausgehende Zahlungen</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Überweisung erstellen
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Badge 
          variant={filterStatus === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilterStatus("all")}
        >
          Alle ({transfers.length})
        </Badge>
        {["draft", "pending_approval", "approved", "completed", "failed"].map(status => {
          const count = transfers.filter(t => t.status === status).length;
          return count > 0 && (
            <Badge 
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterStatus(status)}
            >
              {status} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Transfers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Datum</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Empfänger</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Betrag</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Typ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-600">
                    Keine Überweisungen gefunden
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(transfer => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(transfer.created_date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium">{transfer.recipient_name}</div>
                      <div className="text-gray-600 text-xs">{transfer.recipient_iban.slice(0, 8)}****{transfer.recipient_iban.slice(-4)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {transfer.amount.toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">
                        {transfer.transfer_type === "deposit_refund" ? "Kaution" : 
                         transfer.transfer_type === "invoice_payment" ? "Rechnung" :
                         transfer.transfer_type === "owner_distribution" ? "Ausschüttung" : "Sonstige"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <TransferStatusBadge status={transfer.status} />
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {transfer.status === "pending_approval" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setApproveOpen(true);
                          }}
                        >
                          Freigeben
                        </Button>
                      )}
                      {transfer.status === "approved" && (
                        <Button 
                          size="sm"
                          onClick={() => handleInitiateTransfer(transfer)}
                          className="gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Senden
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bank Transaction Matcher - Auto-matching suggestions */}
      {selectedTransfer && (
        <div className="mt-6">
          <BankTransactionMatcher 
            transaction={selectedTransfer}
            invoices={invoices}
            onMatch={(invoiceId) => {
              toast.success('Rechnung zugeordnet');
              setSelectedTransfer(null);
            }}
            onIgnore={() => setSelectedTransfer(null)}
          />
        </div>
      )}

      <CreateTransferDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ApproveTransferDialog open={approveOpen} onOpenChange={setApproveOpen} transfer={selectedTransfer} />
      <TanInputDialog open={tanOpen} onOpenChange={setTanOpen} transfer={selectedTransfer} />
    </div>
  );
}