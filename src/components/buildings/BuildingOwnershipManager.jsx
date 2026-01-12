import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Building2,
  UserCheck,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import OwnerFormDialog from '@/components/owners/OwnerFormDialog';
import BuildingOwnershipDialog from '@/components/buildings/BuildingOwnershipDialog';

export default function BuildingOwnershipManager({ buildingId }) {
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [showOwnershipForm, setShowOwnershipForm] = useState(false);
  const [editingOwnership, setEditingOwnership] = useState(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const queryClient = useQueryClient();

  // Fetch ownerships for this building
  const { data: ownerships = [], isLoading } = useQuery({
    queryKey: ['building-ownerships', buildingId],
    queryFn: async () => {
      const items = await base44.entities.BuildingOwnership.filter({ 
        building_id: buildingId,
        ist_aktiv: true
      });
      return items;
    },
    enabled: !!buildingId
  });

  // Fetch all owners
  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => base44.entities.Owner.filter({ aktiv: true })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BuildingOwnership.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-ownerships', buildingId] });
      toast.success('Eigentümeranteil gelöscht');
    }
  });

  // Calculate total ownership percentage
  const totalOwnership = ownerships.reduce((sum, o) => sum + (o.anteil_prozent || 0), 0);
  const isComplete = Math.abs(totalOwnership - 100) < 0.01;
  const remainingPercent = 100 - totalOwnership;

  // Get owner details for each ownership
  const getOwnerName = (ownerId) => {
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return 'Unbekannt';
    
    if (owner.eigentuemer_typ === 'natuerliche_person') {
      return `${owner.vorname || ''} ${owner.nachname}`.trim();
    }
    return owner.nachname + (owner.firma_zusatz ? ` ${owner.firma_zusatz}` : '');
  };

  const getOwnerType = (ownerId) => {
    const owner = owners.find(o => o.id === ownerId);
    return owner?.eigentuemer_typ || '';
  };

  const handleEdit = (ownership) => {
    setEditingOwnership(ownership);
    setShowOwnershipForm(true);
  };

  const handleAddNewOwnership = () => {
    setEditingOwnership(null);
    setShowOwnershipForm(true);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-600">Lade Eigentümerdaten...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header mit Fortschritt */}
      <Card className={isComplete ? 'border-emerald-300 bg-emerald-50' : 'border-yellow-300 bg-yellow-50'}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className={`w-6 h-6 ${isComplete ? 'text-emerald-600' : 'text-yellow-600'}`} />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Eigentümerverhältnisse</h3>
                  <p className="text-sm text-slate-600">
                    {ownerships.length} Eigentümer • {totalOwnership.toFixed(2)}% vergeben
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isComplete ? (
                  <Badge className="bg-emerald-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    100% vergeben
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-600 text-white">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Noch {remainingPercent.toFixed(2)}% offen
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={totalOwnership} className="h-3" />
              <div className="flex justify-between text-xs text-slate-600">
                <span>0%</span>
                <span className="font-semibold">{totalOwnership.toFixed(2)}%</span>
                <span>100%</span>
              </div>
            </div>

            {!isComplete && (
              <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700">
                  Die Summe aller Eigentumsanteile muss genau 100% ergeben. 
                  Aktuell fehlen noch <strong>{remainingPercent.toFixed(2)}%</strong>.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleAddNewOwnership}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Eigentumsanteil hinzufügen
        </Button>
        <Button
          onClick={() => setShowOwnerForm(true)}
          variant="outline"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Neuer Eigentümer
        </Button>
      </div>

      {/* Ownerships List */}
      <div className="grid gap-4">
        {ownerships.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-2">Noch keine Eigentümer erfasst</p>
              <p className="text-sm text-slate-500 mb-4">
                Fügen Sie Eigentümer hinzu und weisen Sie ihnen Anteile zu.
              </p>
              <Button
                onClick={handleAddNewOwnership}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ersten Eigentümer hinzufügen
              </Button>
            </CardContent>
          </Card>
        ) : (
          ownerships.map((ownership) => {
            const owner = owners.find(o => o.id === ownership.owner_id);
            
            return (
              <Card key={ownership.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getOwnerName(ownership.owner_id)}
                        <Badge variant="outline" className="text-xs">
                          {ownership.anteil_prozent}%
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className="bg-slate-100 text-slate-700">
                            {getOwnerType(ownership.owner_id).replace('_', ' ')}
                          </Badge>
                          {ownership.gueltig_von && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Calendar className="w-3 h-3" />
                              Seit {format(new Date(ownership.gueltig_von), 'dd.MM.yyyy', { locale: de })}
                            </span>
                          )}
                        </div>
                        {ownership.notarvertrag_nummer && (
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <FileText className="w-3 h-3" />
                            Notar: {ownership.notarvertrag_nummer}
                            {ownership.notarvertrag_datum && ` vom ${format(new Date(ownership.notarvertrag_datum), 'dd.MM.yyyy', { locale: de })}`}
                          </div>
                        )}
                        {owner && (
                          <div className="text-xs text-slate-600 mt-2">
                            {owner.strasse}, {owner.plz} {owner.ort}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ownership)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Eigentümeranteil wirklich löschen?')) {
                            deleteMutation.mutate(ownership.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Ownership Details */}
                {(ownership.grund_aenderung || ownership.grundbuch_eintragung || ownership.bemerkungen) && (
                  <CardContent className="pt-0">
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                      {ownership.grund_aenderung && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Grund:</span>
                          <span className="font-medium text-slate-900">{ownership.grund_aenderung}</span>
                        </div>
                      )}
                      {ownership.grundbuch_eintragung && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Grundbuch:</span>
                          <span className="font-medium text-slate-900">
                            {format(new Date(ownership.grundbuch_eintragung), 'dd.MM.yyyy', { locale: de })}
                          </span>
                        </div>
                      )}
                      {ownership.bemerkungen && (
                        <div>
                          <p className="text-slate-600 mb-1">Bemerkungen:</p>
                          <p className="text-slate-900">{ownership.bemerkungen}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      <OwnerFormDialog
        open={showOwnerForm}
        onOpenChange={setShowOwnerForm}
        onSuccess={(newOwner) => {
          setShowOwnerForm(false);
          setSelectedOwnerId(newOwner.id);
          setShowOwnershipForm(true);
        }}
      />

      <BuildingOwnershipDialog
        open={showOwnershipForm}
        onOpenChange={(open) => {
          setShowOwnershipForm(open);
          if (!open) setEditingOwnership(null);
        }}
        buildingId={buildingId}
        ownership={editingOwnership}
        selectedOwnerId={selectedOwnerId}
        currentTotal={editingOwnership ? totalOwnership - editingOwnership.anteil_prozent : totalOwnership}
        onSuccess={() => {
          setShowOwnershipForm(false);
          setEditingOwnership(null);
          setSelectedOwnerId(null);
          queryClient.invalidateQueries({ queryKey: ['building-ownerships', buildingId] });
        }}
      />
    </div>
  );
}