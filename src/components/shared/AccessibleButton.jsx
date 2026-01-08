import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * Accessibility-optimierter Button mit:
 * - ARIA Labels
 * - Keyboard Navigation
 * - Focus States
 * - Loading States
 */
export default function AccessibleButton({
  children,
  onClick,
  disabled,
  loading,
  ariaLabel,
  icon: Icon,
  variant = "default",
  size = "default",
  className,
  ...props
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={cn(
        "focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500",
        "transition-all duration-200",
        className
      )}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </Button>
  );
}