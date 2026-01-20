import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, MessageCircle, ThumbsUp, Star } from 'lucide-react';

export default function TenantSatisfaction() {
    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages'],
        queryFn: () => base44.entities.TenantMessage.list()
    });

    const resolvedMessages = messages.filter(m => m.status === 'resolved');
    const satisfactionRate = messages.length > 0 ? (resolvedMessages.length / messages.length * 100) : 100;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieterzufriedenheit</h1>
                    <p className="vf-page-subtitle">Feedback & Kommunikation</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Smile className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{satisfactionRate.toFixed(0)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Zufriedenheit</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MessageCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{messages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Anfragen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <ThumbsUp className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{resolvedMessages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gelöst</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">4.5</div>
                        <div className="text-sm opacity-90 mt-1">Ø Bewertung</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mieter-Feedback</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            </div>
                            <div className="font-semibold text-sm">Sehr gute Verwaltung</div>
                            <div className="text-xs text-gray-600 mt-1">Schnelle Reaktionszeiten und professionelle Kommunikation</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <Star className="w-5 h-5 text-gray-300" />
                            </div>
                            <div className="font-semibold text-sm">Guter Service</div>
                            <div className="text-xs text-gray-600 mt-1">Probleme werden zeitnah bearbeitet</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}