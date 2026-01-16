import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Home, Users } from 'lucide-react';

export const PropertyCard = ({ 
  address,
  city,
  imageUrl,
  units,
  tenants,
  cashflow,
  onClick,
  className 
}) => {
  return (
    <div className={cn("vf-property-card", className)} onClick={onClick}>
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={address}
          className="vf-property-card-image"
        />
      )}
      <div className="vf-property-card-body">
        <div className="vf-property-card-address">{address}</div>
        <div className="vf-property-card-city">
          <MapPin className="w-4 h-4 inline mr-1" />
          {city}
        </div>
        
        {(units || tenants) && (
          <div className="vf-property-card-meta">
            {units && (
              <div className="vf-property-card-meta-item">
                <Home className="w-4 h-4" />
                {units} Einheiten
              </div>
            )}
            {tenants && (
              <div className="vf-property-card-meta-item">
                <Users className="w-4 h-4" />
                {tenants} Mieter
              </div>
            )}
          </div>
        )}
        
        {cashflow !== undefined && (
          <div className="vf-property-card-cashflow">
            <span className="vf-property-card-cashflow-label">Cashflow: </span>
            <span className={cn(
              "vf-property-card-cashflow-value",
              cashflow > 0 && "positive",
              cashflow < 0 && "negative"
            )}>
              {new Intl.NumberFormat('de-DE', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(cashflow)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;