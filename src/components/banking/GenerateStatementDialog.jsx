import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function GenerateStatementDialog({ open, onOpenChange }) {
  const [bankAccountId, setBankAccountId] = useState("");
  const [type, setType] = useState("monthly");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: () => base44.entities.BankAccount.list(),
    enabled: open
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleGenerate = async () => {
    if (!bankAccountId) {
      toast.error("Bitte wählen Sie ein Bankkonto");
      return;
    }

    let periodStart = "";
    let periodEnd = "";

    if (type === "monthly" && month) {
      periodStart = `${year}-${month.padStart(2, "0")}-01`;
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : year;
      periodEnd = new Date(nextYear, nextMonth - 1, 0).toISOString().split("T")[0];
    } else if (type === "quarterly") {
      const q = month; // Using month field for quarter selection (1-4)
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      periodStart = `${year}-${startMonth.toString().padStart(2, "0")}-01`;
      periodEnd = new Date(year, endMonth, 0).toISOString().split("T")[0];
    } else if (type === "yearly") {
      periodStart = `${year}-01-01`;
      periodEnd = `${year}-12-31`;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateBankStatement', {
        bank_account_id: bankAccountId,
        period_start: periodStart,
        period_end: periodEnd,
        format
      });

      if (response.data.success) {
        toast.success("Auszug generiert!");
        queryClient.invalidateQueries({ queryKey: ["bank_statements"] });
        onOpenChange(false);
      } else {
        toast.error(response.data.error);
      }
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
          <DialogTitle>Kontoauszug generieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Bankkonto</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie ein Konto..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.iban} ({acc.holder_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Zeitraum</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monat</SelectItem>
                <SelectItem value="quarterly">Quartal</SelectItem>
                <SelectItem value="yearly">Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "monthly" && (
            <div>
              <Label>Monat</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1).toLocaleString("de-DE", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "quarterly" && (
            <div>
              <Label>Quartal</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Jahr</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
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
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (Kontoauszug)</SelectItem>
                <SelectItem value="mt940">MT940 (SWIFT)</SelectItem>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleGenerate} loading={loading}>Generieren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}