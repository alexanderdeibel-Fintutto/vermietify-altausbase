import React from 'react';

export function VfListPageHeader({ title, description, actions }) {
  return (
    <div className="vf-list-page-header">
      <div>
        <h1 className="vf-list-page-title">{title}</h1>
        {description && <p className="vf-list-page-description">{description}</p>}
      </div>
      {actions && <div className="vf-list-page-actions">{actions}</div>}
    </div>
  );
}