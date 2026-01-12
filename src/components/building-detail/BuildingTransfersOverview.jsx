import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TransferStatusBadge from "@/components/banking/TransferStatusBadge";

export default function BuildingTransfersOverview({ buildingId }) {
  const { data: transfers = [] } = useQuery({
    queryKey: ["building-transfers", buildingId],
    queryFn: () => base44.entities.BankTransfer.filter({ building_id: buildingId }, "-created_date", 10)
  });

  if (transfers.length === 0) {
    return (
      <p className="text-gray-600 text-sm">Keine Überweisungen für dieses Gebäude</p>
    );
  }

  return (
    <div className="space-y-2">
      {transfers.map(transfer => (
        <div key={transfer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium text-sm">{transfer.recipient_name}</p>
            <p className="text-xs text-gray-600">{transfer.purpose}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{transfer.amount.toFixed(2)}€</p>
            <TransferStatusBadge status={transfer.status} />
          </div>
        </div>
      ))}
    </div>
  );
}