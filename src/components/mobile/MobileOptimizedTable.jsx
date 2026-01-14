import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileOptimizedTable({ 
  data, 
  renderMobileCard, 
  renderTableRow,
  actions = [] 
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <Card key={index} className="p-4">
            {renderMobileCard ? renderMobileCard(item) : (
              <div className="space-y-2">
                {Object.entries(item).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-slate-600 capitalize">{key}:</span>
                    <span className="font-medium">{value?.toString() || '-'}</span>
                  </div>
                ))}
              </div>
            )}
            
            {actions.length > 0 && (
              <div className="mt-3 pt-3 border-t flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {actions.map((action, idx) => (
                      <DropdownMenuItem key={idx} onClick={() => action.onClick(item)}>
                        {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full">
      <tbody>
        {data.map((item, index) => renderTableRow(item, index))}
      </tbody>
    </table>
  );
}