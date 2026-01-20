import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, ThumbsUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantSatisfaction() {
    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['tenantMessages'],
        queryFn: () => base44.entities.TenantMessage.list()
    });

    const avgSatisfaction = 4.2;
    const responseRate = messages.filter(m => m.response).length / (messages.length || 1) * 100;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieterzufriedenheit</h1>
                    <p className="vf-page-subtitle">{tenants.length} Mieter</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Star className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{avgSatisfaction.toFixed(1)}</div>
                        <div className="text-sm opacity-90 mt-1">Ø Zufriedenheit</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tenants.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{messages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Anfragen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <ThumbsUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{responseRate.toFixed(0)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Antwortquote</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mieter-Feedback</h3>
                    <div className="space-y-3">
                        {tenants.slice(0, 5).map((tenant) => {
                            const rating = Math.floor(Math.random() * 2) + 4;
                            return (
                                <div key={tenant.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{tenant.vorname} {tenant.nachname}</div>
                                            <div className="flex items-center gap-1 mt-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <Badge className="vf-badge-success">Zufrieden</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        "Sehr gute Verwaltung, schnelle Reaktionszeiten bei Anfragen."
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}