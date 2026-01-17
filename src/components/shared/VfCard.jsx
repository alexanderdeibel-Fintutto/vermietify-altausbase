import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function VfCard({ 
  title,
  subtitle,
  children,
  footer,
  clickable = false,
  premium = false,
  className,
  onClick,
  ...props 
}) {
  return (
    <Card 
      className={cn(
        clickable && "vf-card-clickable",
        premium && "vf-card-premium",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle) && (
        <CardHeader className="vf-card-header">
          {title && <CardTitle className="vf-card-title">{title}</CardTitle>}
          {subtitle && <CardDescription className="vf-card-subtitle">{subtitle}</CardDescription>}
        </CardHeader>
      )}
      
      {children && (
        <CardContent className="vf-card-body">
          {children}
        </CardContent>
      )}
      
      {footer && (
        <CardFooter className="vf-card-footer">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}