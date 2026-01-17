import React from 'react';
import { cn } from '@/lib/utils';

export function VfDashboard({ greeting, date, kpis = [], children, className }) {
  return (
    <div className={cn("vf-dashboard", className)}>
      <div className="vf-dashboard__header">
        <h1 className="vf-dashboard__greeting">{greeting}</h1>
        {date && <p className="vf-dashboard__date">{date}</p>}
      </div>
      
      {kpis.length > 0 && (
        <div className="vf-dashboard__kpis">
          {kpis.map((kpi, index) => (
            <VfKpiCard key={index} {...kpi} />
          ))}
        </div>
      )}
      
      {children}
    </div>
  );
}

export function VfKpiCard({ 
  label, 
  value, 
  trend, 
  trendValue, 
  icon: Icon,
  highlighted,
  className 
}) {
  const trendClass = trend === 'up' ? 'vf-kpi-card__trend--positive' :
                     trend === 'down' ? 'vf-kpi-card__trend--negative' :
                     trend === 'warning' ? 'vf-kpi-card__trend--warning' : '';

  return (
    <div className={cn(
      "vf-kpi-card",
      highlighted && "vf-kpi-card--highlighted",
      className
    )}>
      {Icon && <Icon className="h-5 w-5 mb-2 opacity-70" />}
      <div className="vf-kpi-card__value">{value}</div>
      <div className="vf-kpi-card__label">{label}</div>
      {trendValue && (
        <div className={cn("vf-kpi-card__trend", trendClass)}>
          {trendValue}
        </div>
      )}
    </div>
  );
}

export function VfDashboardWidget({ title, actions, children, footer }) {
  return (
    <div className="vf-dashboard-widget">
      {(title || actions) && (
        <div className="vf-dashboard-widget__header">
          {title && <div className="vf-dashboard-widget__title">{title}</div>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="vf-dashboard-widget__body">
        {children}
      </div>
      {footer && (
        <div className="vf-dashboard-widget__footer">
          {footer}
        </div>
      )}
    </div>
  );
}

export function VfBuildingMini({ 
  icon: Icon, 
  name, 
  meta, 
  progress, 
  onClick 
}) {
  return (
    <div className="vf-building-mini" onClick={onClick}>
      <div className="vf-building-mini__icon">
        {Icon ? <Icon className="h-5 w-5" /> : '🏠'}
      </div>
      <div className="vf-building-mini__info">
        <div className="vf-building-mini__name">{name}</div>
        <div className="vf-building-mini__meta">{meta}</div>
      </div>
      {progress !== undefined && (
        <div className="vf-building-mini__progress">
          <div 
            className="vf-building-mini__progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function VfDueItem({ 
  priority = 'normal', 
  title, 
  subtitle, 
  amount 
}) {
  const indicatorClass = priority === 'urgent' ? 'vf-due-item__indicator--urgent' :
                         priority === 'warning' ? 'vf-due-item__indicator--warning' :
                         'vf-due-item__indicator--normal';

  return (
    <div className="vf-due-item">
      <div className={cn("vf-due-item__indicator", indicatorClass)} />
      <div className="vf-due-item__content">
        <div className="vf-due-item__title">{title}</div>
        {subtitle && <div className="vf-due-item__subtitle">{subtitle}</div>}
      </div>
      {amount && (
        <div className="vf-due-item__amount">{amount}</div>
      )}
    </div>
  );
}

export function VfQuickActions({ actions = [] }) {
  return (
    <div className="vf-quick-actions">
      {actions.map((action, index) => {
        const ActionIcon = action.icon;
        return (
          <button 
            key={index} 
            className="vf-quick-action"
            onClick={action.onClick}
          >
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}