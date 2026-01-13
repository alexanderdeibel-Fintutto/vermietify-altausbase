import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function SOLLBookingCard({ booking }) {
  return (
    <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-100">
            <FileText className="w-3 h-3 mr-1" />
            📋 SOLL (Geplant)
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