import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-300",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-medium text-slate-500"
                    >
                        {title}
                    </motion.p>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold text-slate-800 mt-2 tracking-tight"
                    >
                        {value}
                    </motion.p>
                    {subtitle && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm text-slate-400 mt-1"
                        >
                            {subtitle}
                        </motion.p>
                    )}
                    {trend && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className={cn(
                                "inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-xs font-medium",
                                trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            )}
                        >
                            {trend}
                        </motion.div>
                    )}
                </div>
                {Icon && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                        whileHover={{ rotate: 5 }}
                        className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"
                    >
                        <Icon className="w-6 h-6 text-slate-600" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}