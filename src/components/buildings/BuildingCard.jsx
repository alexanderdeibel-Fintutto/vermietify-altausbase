import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Home, ChevronRight } from 'lucide-react';

export default function BuildingCard({ building, units = [] }) {
    const buildingUnits = units.filter(u => u.building_id === building.id);
    const occupiedCount = buildingUnits.filter(u => u.status === 'occupied').length;
    const vacantCount = buildingUnits.filter(u => u.status === 'vacant').length;
    const totalSqm = buildingUnits.reduce((sum, u) => sum + (u.sqm || 0), 0);

    return (
        <Link to={createPageUrl(`BuildingDetail?buildingId=${building.id}`)}>
            <Card className="border-slate-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                    {building.image_url ? (
                        <img 
                            src={building.image_url} 
                            alt={building.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-slate-300" />
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-slate-700 hover:bg-white">
                            {buildingUnits.length} Einheiten
                        </Badge>
                    </div>
                </div>
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-800 group-hover:text-emerald-600 transition-colors">
                                {building.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {building.address} {building.house_number}, {building.postal_code} {building.city}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-sm text-slate-600">{occupiedCount} vermietet</span>
                        </div>
                        {vacantCount > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                <span className="text-sm text-slate-600">{vacantCount} leer</span>
                            </div>
                        )}
                        {totalSqm > 0 && (
                            <span className="text-sm text-slate-400 ml-auto">{totalSqm} m²</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}