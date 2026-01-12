import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, HourglassIcon, ArrowRightCircle, XCircle } from "lucide-react";

const statusConfig = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-800", icon: Clock },
  pending_approval: { label: "Freigabe ausstehend", color: "bg-yellow-100 text-yellow-800", icon: HourglassIcon },
  approved: { label: "Genehmigt", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  pending_tan: { label: "TAN ausstehend", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  executing: { label: "Wird ausgeführt", color: "bg-blue-100 text-blue-800", icon: ArrowRightCircle },
  completed: { label: "Abgeschlossen", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  failed: { label: "Fehlgeschlagen", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Storniert", color: "bg-gray-100 text-gray-800", icon: XCircle }
};

export default function TransferStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1.5 w-fit`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}