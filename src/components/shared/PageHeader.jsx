import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon: ActionIcon = Plus }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="text-slate-500 mt-1">{subtitle}</p>
                )}
            </div>
            {action && (
                <Button 
                    onClick={action}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                    <ActionIcon className="w-4 h-4" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}