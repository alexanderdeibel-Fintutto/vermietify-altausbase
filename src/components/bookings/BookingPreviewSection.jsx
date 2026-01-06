import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, DollarSign } from 'lucide-react';

export default function BookingPreviewSection({ bookingSuggestions }) {
    if (!bookingSuggestions || bookingSuggestions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800">Automatische Buchungen</h3>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                        {bookingSuggestions.length} Buchungen werden erstellt
                    </span>
                </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
                {bookingSuggestions.map((booking, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                    <span className="font-medium text-slate-800 text-sm">
                                        {booking.description}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(booking.due_date).toLocaleDateString('de-DE')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        {booking.amount.toLocaleString('de-DE', { 
                                            style: 'currency', 
                                            currency: 'EUR' 
                                        })}
                                    </div>
                                </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                Geplant
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}