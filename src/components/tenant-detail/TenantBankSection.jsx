import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function TenantBankSection({ tenant, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    iban: tenant?.iban || "",
    bic: tenant?.bic || "",
    bank_name: tenant?.bank_name || ""
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.update(tenant.id, data),
    onSuccess: () => {
      toast.success("Bankverbindung aktualisiert");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["tenant", tenant.id] });
      if (onUpdate) onUpdate();
    },
    onError: (error) => toast.error(error.message)
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const hasIban = !!tenant?.iban;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <CardTitle>Bankverbindung</CardTitle>
          </div>
          {hasIban && <Badge className="bg-green-100 text-green-800">Hinterlegt</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <>
            {hasIban ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">IBAN</p>
                  <p className="font-mono text-sm">{tenant.iban}</p>
                </div>
                {tenant.bic && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">BIC</p>
                    <p className="font-mono text-sm">{tenant.bic}</p>
                  </div>
                )}
                {tenant.bank_name && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Bank</p>
                    <p className="text-sm">{tenant.bank_name}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Keine Bankverbindung hinterlegt</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {hasIban ? "Bearbeiten" : "Hinzufügen"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="iban" className="text-xs">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="DE89370400440532013000"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="bic" className="text-xs">BIC (optional)</Label>
              <Input
                id="bic"
                value={formData.bic}
                onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                placeholder="COBADEFFXXX"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="bank_name" className="text-xs">Bank</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="z.B. Sparkasse"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={updateMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                loading={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Speichern
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}