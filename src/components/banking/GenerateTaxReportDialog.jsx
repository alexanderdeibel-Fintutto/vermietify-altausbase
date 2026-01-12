import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function GenerateTaxReportDialog({ open, onOpenChange }) {
  const [taxYear, setTaxYear] = useState("");
  const [bankAccountIds, setBankAccountIds] = useState([]);
  const [building, setBuilding] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: () => base44.entities.BankAccount.list(),
    enabled: open
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => base44.entities.Building.list(),
    enabled: open
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const toggleAccount = (accountId) => {
    setBankAccountIds(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleGenerate = async () => {
    if (!taxYear) {
      toast.error("Bitte wählen Sie ein Steuerjahr");
      return;
    }

    if (bankAccountIds.length === 0) {
      toast.error("Bitte wählen Sie mindestens ein Bankkonto");
      return;
    }

    setLoading(true);
    try {
      // Generate for each selected account
      for (const accountId of bankAccountIds) {
        const response = await base44.functions.invoke('generateTaxBankReport', {
          bank_account_id: accountId,
          tax_year: parseInt(taxYear),
          building_id: building || null
        });

        if (!response.data.success) {
          toast.error(response.data.error);
          return;
        }
      }

      toast.success("Steuer-Reports generiert!");
      queryClient.invalidateQueries({ queryKey: ["bank_statements"] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Steuer-Jahresübersicht (Anlage V)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Steuerjahr</Label>
            <Select value={taxYear} onValueChange={setTaxYear}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie ein Jahr..." />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Bankkonten</Label>
            <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Konten vorhanden</p>
              ) : (
                accounts.map(acc => (
                  <div key={acc.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={bankAccountIds.includes(acc.id)}
                      onCheckedChange={() => toggleAccount(acc.id)}
                      id={`account-${acc.id}`}
                    />
                    <label htmlFor={`account-${acc.id}`} className="text-sm cursor-pointer">
                      {acc.iban} ({acc.holder_name})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label>Gebäude (optional)</Label>
            <Select value={building} onValueChange={setBuilding}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Gebäude" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Alle Gebäude</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.strasse} {b.hausnummer}, {b.plz} {b.ort}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-blue-400">
            <p className="text-blue-800">
              Der Report gruppiert alle Transaktionen nach Anlage V Zeilen und berechnet die Summen für Ihre Steuererklärung.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleGenerate} loading={loading}>Report generieren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}