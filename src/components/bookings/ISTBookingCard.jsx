import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ISTBookingCard({ booking }) {
  return (
    <Card className="border-solid border-2 border-emerald-500 bg-emerald-50">
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            ✓ IST (Tatsächlich)
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="font-medium">{booking.description}</p>
          <p className="text-sm text-slate-600">{booking.amount}€ • {booking.date}</p>
        </div>
      </div>
    </Card>
  );
}