import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Zap } from 'lucide-react';

export default function QuickActionsMenu({ actions = [], label = 'Schnellaktionen' }) {
  if (actions.length === 0) return null;

  const groupedActions = actions.reduce((acc, action) => {
    const group = action.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(action);
    return acc;
  }, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="w-4 h-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(groupedActions).map(([group, groupActions], groupIdx) => (
          <React.Fragment key={group}>
            {group !== 'default' && (
              <DropdownMenuLabel>{group}</DropdownMenuLabel>
            )}
            {groupActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {Icon && <Icon className="w-4 h-4 mr-2" />}
                  <span>{action.label}</span>
                  {action.badge && (
                    <span className="ml-auto text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      {action.badge}
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
            {groupIdx < Object.keys(groupedActions).length - 1 && (
              <DropdownMenuSeparator />
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}