import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: Building2, label: 'Objekt', page: 'Buildings' },
    { icon: Users, label: 'Mieter', page: 'Tenants' },
    { icon: FileText, label: 'Vertrag', page: 'Contracts' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={cn(
        "flex flex-col-reverse gap-3 mb-3 transition-all",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
      )}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div key={action.page} className="flex items-center gap-3">
              <span className="text-sm font-medium bg-white px-3 py-1 rounded-full shadow-lg">
                {action.label}
              </span>
              <Button
                onClick={() => {
                  navigate(createPageUrl(action.page));
                  setIsOpen(false);
                }}
                className="w-12 h-12 rounded-full shadow-lg"
                variant="gradient"
              >
                <Icon className="h-5 w-5" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-xl"
        variant="gradient"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}