import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function TanInputDialog({ open, onOpenChange, transfer, onSuccess }) {
  const [tan, setTan] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    if (!open) return;
    setTimeLeft(180);
    const interval = setInterval(() => {
      setTimeLeft(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitTan = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('finapiSubmitTan', {
        bank_transfer_id: transfer.id,
        tan: tan || ""
      });

      if (response.data.success) {
        toast.success("Überweisung bestätigt!");
        onOpenChange(false);
        setTan("");
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.error || "TAN submission failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            TAN-Eingabe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-blue-50 space-y-2 border-l-4 border-blue-400">
            <p className="text-sm text-blue-900">
              🔐 Überweisung autorisieren
            </p>
            <p className="text-sm font-semibold">
              Betrag: {transfer?.amount.toFixed(2)}€
            </p>
            <p className="text-sm">
              An: {transfer?.recipient_name}
            </p>
          </Card>

          <div className="space-y-2">
            <Label>Ihre Bank hat eine TAN angefordert</Label>
            <p className="text-sm text-gray-600">
              Verfahren: pushTAN (in Ihrer Banking-App bestätigen)
            </p>
          </div>

          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Timeout in:</div>
            <div className="text-lg font-semibold text-center">
              {formatTime(timeLeft)}
            </div>
            <div className="w-full bg-gray-300 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full transition-all ${timeLeft > 60 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${(timeLeft / 180) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Oder TAN manuell eingeben (falls erforderlich)</Label>
            <Input 
              type="password"
              placeholder="••••••"
              value={tan}
              onChange={(e) => setTan(e.target.value)}
              maxLength="6"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmitTan}
              loading={loading}
              className="flex-1"
            >
              Bestätigen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}