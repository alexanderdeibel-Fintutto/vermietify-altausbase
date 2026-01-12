import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function InsuranceManagement() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        insurance_type: 'krankenversicherung_gesetzlich',
        provider: '',
        contract_number: '',
        annual_premium: 0,
        tax_deductible_amount: 0,
        is_basis_coverage: true
    });

    const { data: insurances = [] } = useQuery({
        queryKey: ['insurances'],
        queryFn: () => base44.entities.InsuranceContract.list()
    });

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingId) {
                return base44.entities.InsuranceContract.update(editingId, data);
            }
            return base44.entities.InsuranceContract.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['insurances']);
            setDialogOpen(false);
            resetForm();
            toast.success(editingId ? 'Versicherung aktualisiert' : 'Versicherung hinzugefügt');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.InsuranceContract.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['insurances']);
            toast.success('Versicherung gelöscht');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            insurance_type: 'krankenversicherung_gesetzlich',
            provider: '',
            contract_number: '',
            annual_premium: 0,
            tax_deductible_amount: 0,
            is_basis_coverage: true
        });
        setEditingId(null);
    };

    const handleEdit = (insurance) => {
        setFormData(insurance);
        setEditingId(insurance.id);
        setDialogOpen(true);
    };

    const totalPremiums = insurances.reduce((sum, i) => sum + (i.annual_premium || 0), 0);
    const totalDeductible = insurances.reduce((sum, i) => sum + (i.tax_deductible_amount || i.annual_premium || 0), 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Versicherungen</h1>
                    <p className="text-slate-500 mt-1">Verwalten Sie Ihre Versicherungsverträge</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Versicherung hinzufügen
                </Button>
            </div>

            {/* Summen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Gesamte Jahresbeiträge</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-light text-slate-900">{formatCurrency(totalPremiums)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Steuerlich absetzbar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-light text-green-600">{formatCurrency(totalDeductible)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Versicherungsliste */}
            {insurances.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-4">Noch keine Versicherungen erfasst</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insurances.map(insurance => (
                        <Card key={insurance.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-medium text-slate-900">{insurance.name}</h3>
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            {getInsuranceTypeLabel(insurance.insurance_type)}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(insurance)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(insurance.id)}>
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Versicherer:</span>
                                        <span className="font-medium">{insurance.provider}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Jahresbeitrag:</span>
                                        <span className="font-medium">{formatCurrency(insurance.annual_premium)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Steuerlich absetzbar:</span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(insurance.tax_deductible_amount || insurance.annual_premium)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Versicherung bearbeiten' : 'Versicherung hinzufügen'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Bezeichnung</label>
                            <Input 
                                placeholder="z.B. AOK Krankenversicherung"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Art der Versicherung</label>
                            <Select value={formData.insurance_type} onValueChange={(v) => setFormData({...formData, insurance_type: v})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="krankenversicherung_gesetzlich">Krankenversicherung (gesetzlich)</SelectItem>
                                    <SelectItem value="krankenversicherung_privat">Krankenversicherung (privat)</SelectItem>
                                    <SelectItem value="pflegeversicherung">Pflegeversicherung</SelectItem>
                                    <SelectItem value="rentenversicherung_gesetzlich">Rentenversicherung (gesetzlich)</SelectItem>
                                    <SelectItem value="ruerup_rente">Rürup-Rente</SelectItem>
                                    <SelectItem value="riester_rente">Riester-Rente</SelectItem>
                                    <SelectItem value="berufsunfaehigkeit">Berufsunfähigkeitsversicherung</SelectItem>
                                    <SelectItem value="lebensversicherung">Lebensversicherung</SelectItem>
                                    <SelectItem value="unfallversicherung">Unfallversicherung</SelectItem>
                                    <SelectItem value="haftpflicht">Haftpflichtversicherung</SelectItem>
                                    <SelectItem value="other">Sonstige</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Versicherer</label>
                                <Input 
                                    placeholder="z.B. AOK"
                                    value={formData.provider}
                                    onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Vertragsnummer (optional)</label>
                                <Input 
                                    value={formData.contract_number}
                                    onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Jahresbeitrag</label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={formData.annual_premium}
                                    onChange={(e) => setFormData({...formData, annual_premium: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Steuerlich absetzbar</label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={formData.tax_deductible_amount}
                                    onChange={(e) => setFormData({...formData, tax_deductible_amount: parseFloat(e.target.value) || 0})}
                                    placeholder={formData.annual_premium.toString()}
                                />
                            </div>
                        </div>

                        {(formData.insurance_type.includes('krankenversicherung')) && (
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={formData.is_basis_coverage}
                                    onCheckedChange={(checked) => setFormData({...formData, is_basis_coverage: checked})}
                                />
                                <label className="text-sm text-slate-700">Basisabsicherung</label>
                            </div>
                        )}

                        <Button 
                            onClick={() => saveMutation.mutate(formData)}
                            disabled={!formData.name || !formData.provider || saveMutation.isPending}
                            className="w-full"
                        >
                            {editingId ? 'Aktualisieren' : 'Hinzufügen'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function getInsuranceTypeLabel(type) {
    const labels = {
        'krankenversicherung_gesetzlich': 'Krankenversicherung (gesetzlich)',
        'krankenversicherung_privat': 'Krankenversicherung (privat)',
        'pflegeversicherung': 'Pflegeversicherung',
        'rentenversicherung_gesetzlich': 'Rentenversicherung',
        'ruerup_rente': 'Rürup-Rente',
        'riester_rente': 'Riester-Rente',
        'berufsunfaehigkeit': 'Berufsunfähigkeit',
        'lebensversicherung': 'Lebensversicherung',
        'unfallversicherung': 'Unfallversicherung',
        'haftpflicht': 'Haftpflicht',
        'other': 'Sonstige'
    };
    return labels[type] || type;
}