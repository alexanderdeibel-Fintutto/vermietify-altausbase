import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
    return (
        <div className={cn(
            "bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-300",
            className
        )}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={cn(
                            "inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-xs font-medium",
                            trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                            {trend}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-600" />
                    </div>
                )}
            </div>
        </div>
    );
}