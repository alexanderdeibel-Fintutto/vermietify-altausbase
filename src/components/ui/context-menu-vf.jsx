import React from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

export default function ContextMenuVf({ children, actions = [] }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <ContextMenuItem
              key={idx}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.destructive ? 'text-red-600 focus:text-red-600' : ''}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {action.label}
              {action.shortcut && (
                <span className="ml-auto text-xs text-gray-500">
                  {action.shortcut}
                </span>
              )}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}