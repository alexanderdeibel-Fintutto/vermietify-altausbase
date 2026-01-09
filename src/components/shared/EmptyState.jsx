import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 bg-[var(--color-primary-100)] rounded-2xl flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-[var(--color-primary-300)]" />
            </div>
            <h3 className="text-lg font-light text-[var(--color-primary-700)] mb-2">{title}</h3>
            <p className="text-sm font-extralight text-[var(--color-primary-400)] text-center max-w-md mb-8">{description}</p>
            {action && (
                <Button 
                    onClick={action}
                    className="bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)] text-white font-extralight gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}