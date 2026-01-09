import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon: ActionIcon = Plus }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-extralight text-slate-600 tracking-wide">{title}</h1>
                {subtitle && (
                    <p className="text-sm font-extralight text-slate-400 mt-1">{subtitle}</p>
                )}
            </div>
            {action && (
                <Button 
                    onClick={action}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-extralight gap-2"
                >
                    <ActionIcon className="w-4 h-4" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}