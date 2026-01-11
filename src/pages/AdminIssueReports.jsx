import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Activity, CheckCircle, Eye, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusColors = {
  open: 'bg-yellow-500',
  acknowledged: 'bg-blue-500',
  in_progress: 'bg-orange-500',
  resolved: 'bg-green-500',
  closed: 'bg-slate-500'
};

export default function AdminIssueReports() {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: issues = [] } = useQuery({
    queryKey: ['all-issue-reports'],
    queryFn: () => base44.entities.TenantIssueReport.list('-created_date', 100)
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ issueId, status, notes }) => {
      const updateData = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = (await base44.auth.me()).email;
        updateData.resolution_notes = notes;
      }
      await base44.entities.TenantIssueReport.update(issueId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-issue-reports']);
      setSelectedIssue(null);
      setResolutionNotes('');
      toast.success('Status aktualisiert');
    }
  });

  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'acknowledged');
  const inProgressIssues = issues.filter(i => i.status === 'in_progress');
  const resolvedIssues = issues.filter(i => i.status === 'resolved' || i.status === 'closed');

  // Analytics
  const avgResolutionTime = resolvedIssues.length > 0 
    ? Math.round(resolvedIssues.reduce((sum, i) => {
        const created = new Date(i.created_date).getTime();
        const resolved = new Date(i.resolved_at || Date.now()).getTime();
        return sum + (resolved - created);
      }, 0) / resolvedIssues.length / (1000 * 60 * 60 * 24))
    : 0;

  const issuesByType = issues.reduce((acc, i) => {
    const type = i.issue_type || 'Sonstige';
    const existing = acc.find(item => item.name === type);
    if (existing) existing.count++;
    else acc.push({ name: type, count: 1 });
    return acc;
  }, []);

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  const getBuildingName = (buildingId) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || 'Unbekannt';
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Störungsmeldungen</h1>
          <p className="text-slate-600">Mieter-Probleme verwalten</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-6">
             <div className="text-3xl font-bold text-yellow-600">{openIssues.length}</div>
             <p className="text-slate-600 text-sm">Offen</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-6">
             <div className="text-3xl font-bold text-orange-600">{inProgressIssues.length}</div>
             <p className="text-slate-600 text-sm">In Bearbeitung</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-6">
             <div className="text-3xl font-bold text-green-600">{resolvedIssues.length}</div>
             <p className="text-slate-600 text-sm">Gelöst</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-3xl font-bold">{avgResolutionTime}</p>
                 <p className="text-slate-600 text-sm">Ø Lösungszeit (Tage)</p>
               </div>
               <TrendingUp className="w-8 h-8 text-blue-500" />
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Issues by Type */}
       {issuesByType.length > 0 && (
         <Card>
           <CardHeader>
             <CardTitle className="text-lg">Störungen nach Kategorie</CardTitle>
           </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={250}>
               <BarChart data={issuesByType}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="count" fill="#ef4444" name="Anzahl" />
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
       )}

      <div className="grid gap-3">
        {issues.map(issue => (
          <Card key={issue.id} className={selectedIssue?.id === issue.id ? 'border-blue-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[issue.status]}>
                      {issue.status}
                    </Badge>
                    <Badge variant="outline">{issue.issue_type}</Badge>
                    <Badge variant="outline" className={
                      issue.severity === 'critical' ? 'border-red-500 text-red-700' :
                      issue.severity === 'high' ? 'border-orange-500 text-orange-700' :
                      'border-slate-300'
                    }>
                      {issue.severity}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{issue.title}</CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Mieter: {getTenantName(issue.tenant_id)} • Gebäude: {getBuildingName(issue.building_id)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Gemeldet am: {new Date(issue.created_date).toLocaleString('de-DE')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {selectedIssue?.id === issue.id && (
              <CardContent className="border-t space-y-4">
                <div>
                  <label className="text-sm font-semibold">Beschreibung</label>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{issue.description}</p>
                </div>

                {issue.related_sensor_id && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">
                        IoT-Sensor verknüpft
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      Messwert: <strong>{issue.sensor_reading_value} (Zeitpunkt der Meldung)</strong>
                    </p>
                  </div>
                )}

                {issue.photos?.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Fotos</label>
                    <div className="grid grid-cols-3 gap-2">
                      {issue.photos.map((photo, idx) => (
                        <a key={idx} href={photo} target="_blank" rel="noopener noreferrer">
                          <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold mb-2 block">Status ändern</label>
                  <Select
                    value={issue.status}
                    onValueChange={(status) => updateStatusMutation.mutate({ issueId: issue.id, status })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="acknowledged">Bestätigt</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="resolved">Gelöst</SelectItem>
                      <SelectItem value="closed">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {issue.status !== 'resolved' && issue.status !== 'closed' && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Lösungsnotizen</label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Beschreibung der Lösung..."
                      rows={3}
                    />
                    <Button
                      className="mt-2"
                      onClick={() => updateStatusMutation.mutate({
                        issueId: issue.id,
                        status: 'resolved',
                        notes: resolutionNotes
                      })}
                      disabled={!resolutionNotes}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Als gelöst markieren
                    </Button>
                  </div>
                )}

                {issue.resolved_at && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold text-green-900">Gelöst</p>
                    <p className="text-xs text-slate-600">
                      {new Date(issue.resolved_at).toLocaleString('de-DE')} • {issue.resolved_by}
                    </p>
                    {issue.resolution_notes && (
                      <p className="text-sm text-slate-700 mt-2">{issue.resolution_notes}</p>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      </div>
      );
}