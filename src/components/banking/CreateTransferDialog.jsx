import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Home, Wrench, Users, PencilLine } from "lucide-react";
import { toast } from "sonner";

export default function CreateTransferDialog({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState(null);
  const [customPurpose, setCustomPurpose] = useState("");

  const { data: contracts = [] } = useQuery({
    queryKey: ["lease_contracts"],
    queryFn: () => base44.entities.LeaseContract.list(),
    enabled: open
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices_unpaid"],
    queryFn: () => base44.entities.Invoice.filter({ status: "unpaid" }),
    enabled: open
  });

  const { data: owners = [] } = useQuery({
    queryKey: ["owners"],
    queryFn: () => base44.entities.Owner.list(),
    enabled: open
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: () => base44.entities.BankAccount.list(),
    enabled: open
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: open
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list(),
    enabled: open
  });

  const handleCreateTransfer = async () => {
    if (!bankAccountId) {
      toast.error("Bitte wählen Sie ein Quellkonto");
      return;
    }

    let recipientName = "";
    let recipientIban = "";
    let recipientBic = "";
    let amount = 0;
    let purpose = customPurpose;
    let referenceType = null;
    let referenceId = null;
    let transferType = null;

    try {
      if (type === "deposit_refund") {
        const contract = contracts.find(c => c.id === selectedId);
        if (!contract) throw new Error("Vertrag nicht gefunden");
        
        const tenant = tenants.find(t => t.id === contract.tenant_id);
        if (!tenant || !tenant.iban) throw new Error("Mieter hat keine IBAN");

        recipientName = `${tenant.first_name} ${tenant.last_name}`;
        recipientIban = tenant.iban;
        recipientBic = tenant.bic || "";
        amount = contract.deposit;
        purpose = `Kautionsrückzahlung für ${contract.unit_id}`;
        referenceType = "lease_contract";
        referenceId = contract.id;
        transferType = "deposit_refund";
      } else if (type === "invoice_payment") {
        const invoice = invoices.find(i => i.id === selectedId);
        if (!invoice) throw new Error("Rechnung nicht gefunden");

        const supplier = suppliers.find(s => s.id === invoice.supplier_id);
        if (!supplier || !supplier.iban) throw new Error("Lieferant hat keine IBAN");

        recipientName = supplier.name;
        recipientIban = supplier.iban;
        recipientBic = supplier.bic || "";
        amount = invoice.total_amount;
        purpose = `Rechnungszahlung ${invoice.invoice_number}`;
        referenceType = "invoice";
        referenceId = invoice.id;
        transferType = "invoice_payment";
      } else if (type === "owner_distribution") {
        const owner = owners.find(o => o.id === selectedId);
        if (!owner || !owner.iban) throw new Error("Eigentümer hat keine IBAN");

        recipientName = owner.nachname;
        recipientIban = owner.iban;
        recipientBic = owner.bic || "";
        amount = parseFloat(customAmount);
        referenceType = "owner";
        referenceId = owner.id;
        transferType = "owner_distribution";
      }

      const transfer = await base44.entities.BankTransfer.create({
        bank_account_id: bankAccountId,
        transfer_type: transferType,
        amount,
        recipient_name: recipientName,
        recipient_iban: recipientIban,
        recipient_bic: recipientBic,
        purpose,
        reference_type: referenceType,
        reference_id: referenceId,
        status: amount >= 1000 ? "pending_approval" : "approved",
        requires_dual_control: amount >= 1000,
        created_by_email: "current_user@example.com" // TODO: get from auth
      });

      toast.success("Überweisung erstellt");
      onOpenChange(false);
      setStep(1);
      setType(null);
      setSelectedId(null);
      setCustomAmount("");
      setBankAccountId(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Überweisung erstellen</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Was möchten Sie überweisen?</p>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className="p-4 cursor-pointer hover:bg-slate-50 border-2 hover:border-blue-300"
                onClick={() => { setType("deposit_refund"); setStep(2); }}
              >
                <Home className="w-6 h-6 mb-2 text-blue-600" />
                <div className="font-semibold text-sm">Kaution zurückzahlen</div>
              </Card>
              <Card 
                className="p-4 cursor-pointer hover:bg-slate-50 border-2 hover:border-blue-300"
                onClick={() => { setType("invoice_payment"); setStep(2); }}
              >
                <Wrench className="w-6 h-6 mb-2 text-orange-600" />
                <div className="font-semibold text-sm">Rechnung bezahlen</div>
              </Card>
              <Card 
                className="p-4 cursor-pointer hover:bg-slate-50 border-2 hover:border-blue-300"
                onClick={() => { setType("owner_distribution"); setStep(2); }}
              >
                <Users className="w-6 h-6 mb-2 text-green-600" />
                <div className="font-semibold text-sm">Eigentümer Ausschüttung</div>
              </Card>
              <Card 
                className="p-4 cursor-pointer hover:bg-slate-50 border-2 hover:border-blue-300"
                onClick={() => { setType("other"); setStep(2); }}
              >
                <PencilLine className="w-6 h-6 mb-2 text-purple-600" />
                <div className="font-semibold text-sm">Freie Überweisung</div>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && type === "deposit_refund" && (
          <div className="space-y-4">
            <div>
              <Label>Mietvertrag auswählen</Label>
              <Select value={selectedId || ""} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Vertrag..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.unit_id} - {c.deposit}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setStep(3)} className="w-full">Weiter</Button>
          </div>
        )}

        {step === 2 && type === "invoice_payment" && (
          <div className="space-y-4">
            <div>
              <Label>Offene Rechnung auswählen</Label>
              <Select value={selectedId || ""} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie eine Rechnung..." />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoice_number} - {i.total_amount}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setStep(3)} className="w-full">Weiter</Button>
          </div>
        )}

        {step === 2 && type === "owner_distribution" && (
          <div className="space-y-4">
            <div>
              <Label>Eigentümer auswählen</Label>
              <Select value={selectedId || ""} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Eigentümer..." />
                </SelectTrigger>
                <SelectContent>
                  {owners.filter(o => o.iban).map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nachname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Betrag (€)</Label>
              <Input 
                type="number" 
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Verwendungszweck</Label>
              <Input 
                placeholder="z.B. Mietüberschuss Q4/2025"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
              />
            </div>
            <Button onClick={() => setStep(3)} className="w-full">Weiter</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Von Konto</Label>
              <Select value={bankAccountId || ""} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie ein Konto..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.iban} ({acc.current_balance?.toFixed(2) || "0.00"}€)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-blue-400">
              {customAmount >= 1000 || (type !== "other" && selectedId) ? (
                <p className="text-blue-800">⚠️ 4-Augen-Prinzip erforderlich - Diese Überweisung muss freigegeben werden.</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Zurück</Button>
              <Button onClick={handleCreateTransfer} className="flex-1">Erstellen</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}