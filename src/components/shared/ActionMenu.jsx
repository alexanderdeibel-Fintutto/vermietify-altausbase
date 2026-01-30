import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

export default function ActionMenu({ actions = [] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          
          if (action.separator) {
            return <DropdownMenuSeparator key={idx} />;
          }

          return (
            <DropdownMenuItem
              key={idx}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.destructive ? 'text-red-600' : ''}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}