import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function LoadingSpinner({ 
  size = "default", 
  text,
  fullScreen = false,
  className 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const content = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-emerald-600", sizeClasses[size])} />
      {text && <p className="text-sm text-slate-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return content;
}