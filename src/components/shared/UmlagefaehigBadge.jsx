import { Badge } from '@/components/ui/badge';

export default function UmlagefaehigBadge({ status = 'umlagefaehig' }) {
  const config = {
    umlagefaehig: {
      label: '🟢 Umlagefähig (BetrKV)',
      className: 'bg-green-100 text-green-800'
    },
    nicht_umlagefaehig: {
      label: '🔴 Nicht umlagefähig',
      className: 'bg-red-100 text-red-800'
    },
    teilweise_umlagefaehig: {
      label: '🟡 Teilweise umlagefähig',
      className: 'bg-yellow-100 text-yellow-800'
    }
  };

  const { label, className } = config[status] || config.umlagefaehig;

  return <Badge className={className}>{label}</Badge>;
}