import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Send, AlertCircle, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import CreateTransferDialog from "@/components/banking/CreateTransferDialog";
import ApproveTransferDialog from "@/components/banking/ApproveTransferDialog";
import TanInputDialog from "@/components/banking/TanInputDialog";
import TransferStatusBadge from "@/components/banking/TransferStatusBadge";
import { toast } from "sonner";
import BankTransactionMatches from "@/components/banking/BankTransactionMatches";
import ISTBookingCard from "@/components/shared/ISTBookingCard";
import AIMatchSuggestions from "@/components/banking/AIMatchSuggestions";
import BankTransactionMatchSuggestions from "@/components/banking/BankTransactionMatchSuggestions";
import BatchMatchButton from "@/components/banking/BatchMatchButton";

export default function BankTransactionsPage() {
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

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.LeaseContract?.list?.() || []
  });

  const filteredTransfers = transfers.filter(t => 
    filterStatus === "all" || t.status === filterStatus
  );

  const handleInitiateTransfer = async (transfer) => {
    // ... (existing logic)
  };

  const handleMatch = (invoiceId) => {
    console.log(`Matching transaction ${selectedTransfer.id} with invoice ${invoiceId}`);
    // Add mutation logic here
    setSelectedTransfer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tatsächliche Zahlungen (IST)</h1>
          <p className="text-gray-600 mt-1">Importierte Banktransaktionen und manuelle Zahlungen</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Transaktion
        </Button>
      </div>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Für jede Transaktion muss eine Verknüpfung zu einer Rechnung erstellt werden, damit sie in der EÜR korrekt berücksichtigt wird.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {/* ... (filter badges) ... */}
      </div>

      {/* Batch Accept Button */}
      <BatchMatchButton 
        transactions={filteredTransfers}
        invoices={invoices}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransfers.map(transfer => (
          <ISTBookingCard 
            key={transfer.id}
            title={transfer.recipient_name || 'Unbekannt'}
            amount={transfer.amount}
            date={new Date(transfer.created_date).toLocaleDateString('de-DE')}
            description={transfer.description || 'Keine Beschreibung'}
          >
            <div className="mt-4 pt-4 border-t space-y-3">
              <AIMatchSuggestions transaction={transfer} />
              <BankTransactionMatches transaction={transfer} invoices={invoices} onMatch={handleMatch} onIgnore={() => {}} />
            </div>
          </ISTBookingCard>
        ))}
      </div>

      <CreateTransferDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ApproveTransferDialog open={approveOpen} onOpenChange={setApproveOpen} transfer={selectedTransfer} />
      <TanInputDialog open={tanOpen} onOpenChange={setTanOpen} transfer={selectedTransfer} />
    </div>
  );
}