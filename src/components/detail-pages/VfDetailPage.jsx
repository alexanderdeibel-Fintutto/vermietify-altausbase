import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  VfDropdown,
  VfDropdownTrigger,
  VfDropdownContent,
  VfDropdownItem
} from '@/components/ui/vf-dropdown';

export function VfDetailPage({ 
  backLink,
  icon: Icon,
  title,
  subtitle,
  status,
  stats = [],
  tabs = [],
  defaultTab,
  children,
  primaryAction,
  secondaryActions = [],
  sidebar
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(t => t.id === activeTab);

  return (
    <div>
      {/* Header */}
      <div className="vf-detail-header">
        {backLink && (
          <Link to={backLink.href} className="vf-detail-header__back">
            <ChevronLeft className="h-4 w-4" />
            {backLink.label || 'Zurück'}
          </Link>
        )}
        
        <div className="vf-detail-header__top">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="vf-detail-header__icon">
                <Icon className="h-6 w-6" />
              </div>
            )}
            <div className="vf-detail-header__info">
              <h1 className="vf-detail-header__title">{title}</h1>
              {subtitle && <p className="vf-detail-header__subtitle">{subtitle}</p>}
            </div>
          </div>
          
          <div className="vf-detail-header__actions">
            {primaryAction && (
              <Button variant="gradient" onClick={primaryAction.onClick}>
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                {primaryAction.label}
              </Button>
            )}
            
            {secondaryActions.length > 0 && (
              <VfDropdown>
                <VfDropdownTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </VfDropdownTrigger>
                <VfDropdownContent>
                  {secondaryActions.map((action, index) => (
                    <VfDropdownItem 
                      key={index} 
                      onClick={action.onClick}
                      destructive={action.destructive}
                    >
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </VfDropdownItem>
                  ))}
                </VfDropdownContent>
              </VfDropdown>
            )}
          </div>
        </div>
        
        {stats.length > 0 && (
          <div className="vf-detail-header__stats">
            {stats.map((stat, index) => (
              <div key={index} className="vf-detail-stat">
                <div className="vf-detail-stat__value">{stat.value}</div>
                <div className="vf-detail-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="vf-detail-tabs">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "vf-detail-tabs__tab",
                  activeTab === tab.id && "vf-detail-tabs__tab--active"
                )}
              >
                {TabIcon && <TabIcon className="h-4 w-4" />}
                {tab.label}
                {tab.badge > 0 && (
                  <span className="vf-detail-tabs__badge">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="vf-detail-layout">
        <div className="vf-detail-main">
          {activeTabContent ? activeTabContent.content : children}
        </div>
        
        {sidebar && (
          <div className="vf-detail-sidebar">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}

export function VfDetailSidebar({ sections = [] }) {
  return (
    <>
      {sections.map((section, index) => (
        <div key={index} className="vf-detail-sidebar__section">
          {section.title && (
            <div className="vf-detail-sidebar__title">{section.title}</div>
          )}
          {section.content}
        </div>
      ))}
    </>
  );
}