import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BookmarkIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function TemplateQuickSelect({ onSelect }) {
  const { data: templates = [] } = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return await base44.entities.InvoiceTemplate.filter({ user_email: user.email });
    }
  });

  if (templates.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <BookmarkIcon className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {templates.map(template => (
          <DropdownMenuItem 
            key={template.id}
            onClick={() => onSelect({
              recipient: template.recipient,
              cost_category_id: template.cost_category_id,
              type: template.type,
              operating_cost_relevant: template.operating_cost_relevant,
              building_id: template.building_id
            })}
          >
            {template.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}