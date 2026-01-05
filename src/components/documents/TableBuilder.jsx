import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from 'lucide-react';

const DATA_SOURCES = {
    meter: {
        label: 'Zähler (Meter)',
        fields: [
            { key: 'meter_type', label: 'Zählertyp' },
            { key: 'meter_number', label: 'Zählernummer' },
            { key: 'location_description', label: 'Standort' },
            { key: 'reading', label: 'Zählerstand' }
        ]
    },
    contract_payments: {
        label: 'Mietzahlungen',
        fields: [
            { key: 'payment_month', label: 'Monat' },
            { key: 'base_rent', label: 'Kaltmiete' },
            { key: 'utilities', label: 'Nebenkosten' },
            { key: 'total_rent', label: 'Warmmiete' },
            { key: 'status', label: 'Status' }
        ]
    }
};

export default function TableBuilder({ open, onOpenChange, onSave }) {
    const [tableConfig, setTableConfig] = useState({
        id: '',
        title: '',
        data_source: '',
        columns: []
    });

    const handleAddColumn = () => {
        setTableConfig({
            ...tableConfig,
            columns: [...tableConfig.columns, { field: '', label: '', width: '100px' }]
        });
    };

    const handleUpdateColumn = (index, field, value) => {
        const newColumns = [...tableConfig.columns];
        newColumns[index][field] = value;
        setTableConfig({...tableConfig, columns: newColumns});
    };

    const handleRemoveColumn = (index) => {
        const newColumns = [...tableConfig.columns];
        newColumns.splice(index, 1);
        setTableConfig({...tableConfig, columns: newColumns});
    };

    const handleSave = () => {
        if (!tableConfig.id || !tableConfig.title || !tableConfig.data_source || tableConfig.columns.length === 0) {
            alert('Bitte alle Felder ausfüllen');
            return;
        }
        onSave(tableConfig);
        setTableConfig({ id: '', title: '', data_source: '', columns: [] });
    };

    const availableFields = tableConfig.data_source ? DATA_SOURCES[tableConfig.data_source]?.fields || [] : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Tabelle erstellen</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tabellen-ID</Label>
                            <Input
                                value={tableConfig.id}
                                onChange={(e) => setTableConfig({...tableConfig, id: e.target.value})}
                                placeholder="z.B. meters, payments"
                            />
                        </div>
                        <div>
                            <Label>Titel</Label>
                            <Input
                                value={tableConfig.title}
                                onChange={(e) => setTableConfig({...tableConfig, title: e.target.value})}
                                placeholder="z.B. Zählerstände"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Datenquelle</Label>
                        <Select
                            value={tableConfig.data_source}
                            onValueChange={(value) => setTableConfig({...tableConfig, data_source: value, columns: []})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Datenquelle wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(DATA_SOURCES).map(([key, source]) => (
                                    <SelectItem key={key} value={key}>{source.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {tableConfig.data_source && (
                        <>
                            <div className="flex items-center justify-between">
                                <Label>Spalten</Label>
                                <Button size="sm" onClick={handleAddColumn}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Spalte hinzufügen
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {tableConfig.columns.map((column, index) => (
                                    <Card key={index} className="p-3">
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-5">
                                                <Select
                                                    value={column.field}
                                                    onValueChange={(value) => {
                                                        const field = availableFields.find(f => f.key === value);
                                                        handleUpdateColumn(index, 'field', value);
                                                        handleUpdateColumn(index, 'label', field?.label || '');
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Feld wählen" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableFields.map((field) => (
                                                            <SelectItem key={field.key} value={field.key}>
                                                                {field.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-4">
                                                <Input
                                                    value={column.label}
                                                    onChange={(e) => handleUpdateColumn(index, 'label', e.target.value)}
                                                    placeholder="Spaltentitel"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    value={column.width}
                                                    onChange={(e) => handleUpdateColumn(index, 'width', e.target.value)}
                                                    placeholder="Breite"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveColumn(index)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                {tableConfig.columns.length === 0 && (
                                    <Card className="p-8 text-center text-slate-500">
                                        Noch keine Spalten definiert
                                    </Card>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleSave}>
                        Tabelle einfügen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}