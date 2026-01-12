import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp, TrendingDown, Info, ArrowRight, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TaxSimulation() {
    const [selectedHoldingId, setSelectedHoldingId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [quantityPercent, setQuantityPercent] = useState(100);
    const [salePrice, setSalePrice] = useState(0);
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [simulationResult, setSimulationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const { data: holdings = [] } = useQuery({
        queryKey: ['assetHoldings'],
        queryFn: () => base44.entities.AssetHolding.list()
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => base44.entities.Asset.list()
    });

    const selectedHolding = holdings.find(h => h.id === selectedHoldingId);
    const selectedAsset = selectedHolding ? assets.find(a => a.id === selectedHolding.asset_id) : null;

    useEffect(() => {
        if (selectedHolding) {
            const maxQuantity = selectedHolding.quantity;
            setQuantity(maxQuantity);
            setQuantityPercent(100);
            setSalePrice(selectedHolding.current_price || 0);
        }
    }, [selectedHolding]);

    const handlePercentChange = (value) => {
        if (!selectedHolding) return;
        const percent = value[0];
        setQuantityPercent(percent);
        setQuantity((selectedHolding.quantity * percent) / 100);
    };

    const handleQuantityChange = (value) => {
        if (!selectedHolding) return;
        const qty = parseFloat(value) || 0;
        setQuantity(qty);
        setQuantityPercent((qty / selectedHolding.quantity) * 100);
    };

    const runSimulation = async () => {
        if (!selectedHoldingId || quantity <= 0 || salePrice <= 0) {
            toast.error('Bitte alle Felder ausfüllen');
            return;
        }

        setLoading(true);
        try {
            const response = await base44.functions.invoke('simulateSaleScenario', {
                asset_holding_id: selectedHoldingId,
                quantity,
                sale_price: salePrice,
                sale_date: saleDate
            });
            
            setSimulationResult(response.data);
            toast.success('Simulation erfolgreich');
        } catch (error) {
            toast.error('Fehler bei der Simulation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-light text-slate-900">Verkaufs-Simulation</h1>
                <p className="text-slate-500 mt-1">Berechnen Sie die steuerlichen Auswirkungen eines Verkaufs</p>
            </div>

            {/* Wizard */}
            <div className="space-y-6">
                {/* Schritt 1: Asset auswählen */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">1</span>
                            Asset auswählen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedHoldingId} onValueChange={setSelectedHoldingId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Asset auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {holdings.map(holding => {
                                    const asset = assets.find(a => a.id === holding.asset_id);
                                    return (
                                        <SelectItem key={holding.id} value={holding.id}>
                                            {asset?.name || 'Unbekannt'} - {holding.quantity} Stück
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        {selectedAsset && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Symbol:</span>
                                    <span className="font-medium">{selectedAsset.symbol}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Aktueller Kurs:</span>
                                    <span className="font-medium">{selectedHolding.current_price?.toFixed(2) || '-'} €</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Bestand:</span>
                                    <span className="font-medium">{selectedHolding.quantity} Stück</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Unrealisierter G/V:</span>
                                    <span className={`font-medium ${
                                        selectedHolding.unrealized_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {selectedHolding.unrealized_gain_loss >= 0 ? '+' : ''}
                                        {selectedHolding.unrealized_gain_loss?.toFixed(2) || '0.00'} €
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Schritt 2: Menge eingeben */}
                {selectedHoldingId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">2</span>
                                Menge festlegen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Prozent der Position</label>
                                <div className="flex items-center gap-4">
                                    <Slider 
                                        value={[quantityPercent]} 
                                        onValueChange={handlePercentChange}
                                        max={100}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-sm font-medium text-slate-900 w-12">{quantityPercent.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Exakte Menge</label>
                                <Input 
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    step="0.01"
                                    max={selectedHolding?.quantity}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Schritt 3: Verkaufspreis */}
                {selectedHoldingId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">3</span>
                                Verkaufspreis und -datum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Verkaufspreis pro Stück (EUR)</label>
                                <Input 
                                    type="number"
                                    value={salePrice}
                                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Verkaufsdatum</label>
                                <Input 
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                />
                            </div>

                            <Button onClick={runSimulation} disabled={loading} className="w-full">
                                <Calculator className="h-4 w-4 mr-2" />
                                {loading ? 'Berechne...' : 'Simulation starten'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Ergebnis */}
                {simulationResult && (
                    <Card className="border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-600" />
                                Simulationsergebnis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Zusammenfassung */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-sm text-slate-600 mb-1">Brutto-Erlös</div>
                                    <div className="text-2xl font-light text-slate-900">
                                        {simulationResult.sale_summary.gross_proceeds.toFixed(2)} €
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-sm text-slate-600 mb-1">Gewinn/Verlust</div>
                                    <div className={`text-2xl font-light ${
                                        simulationResult.sale_summary.gross_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {simulationResult.sale_summary.gross_gain_loss >= 0 ? '+' : ''}
                                        {simulationResult.sale_summary.gross_gain_loss.toFixed(2)} €
                                    </div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <div className="text-sm text-red-600 mb-1">Geschätzte Steuer</div>
                                    <div className="text-2xl font-light text-red-900">
                                        {simulationResult.tax_calculation.estimated_tax.toFixed(2)} €
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-sm text-green-600 mb-1">Netto-Erlös</div>
                                    <div className="text-2xl font-light text-green-900">
                                        {simulationResult.tax_calculation.net_proceeds_after_tax.toFixed(2)} €
                                    </div>
                                </div>
                            </div>

                            {/* Steuerdetails */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-slate-900 mb-3">Steuerliche Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Steuerpflichtiger Gewinn:</span>
                                        <span className="font-medium">{simulationResult.tax_calculation.taxable_gain.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Steuersatz:</span>
                                        <span className="font-medium">{(simulationResult.tax_calculation.tax_rate * 100).toFixed(3)}%</span>
                                    </div>
                                    {simulationResult.tax_calculation.partial_exemption_rate > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Teilfreistellung:</span>
                                            <span className="font-medium">{(simulationResult.tax_calculation.partial_exemption_rate * 100).toFixed(0)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verwendete Tax Lots */}
                            {simulationResult.tax_lots_used.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium text-slate-900 mb-3">Verwendete Kaufpositionen (FIFO)</h4>
                                    <div className="space-y-2">
                                        {simulationResult.tax_lots_used.map((lot, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-slate-600">Kaufdatum:</span>
                                                    <span className="font-medium">{new Date(lot.purchase_date).toLocaleDateString('de-DE')}</span>
                                                </div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-slate-600">Menge:</span>
                                                    <span className="font-medium">{lot.quantity_sold.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-slate-600">Haltedauer:</span>
                                                    <span className="font-medium">{lot.holding_period_days} Tage</span>
                                                </div>
                                                {lot.is_tax_exempt && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-2">
                                                        Steuerfrei (Spekulationsfrist)
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Optimierungshinweise */}
                            {simulationResult.optimization_hints.length > 0 && (
                                <Alert className="border-yellow-200 bg-yellow-50">
                                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-900">
                                        <p className="font-medium mb-2">Optimierungshinweise</p>
                                        <ul className="space-y-1 text-sm">
                                            {simulationResult.optimization_hints.map((hint, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                    <span>{hint}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}