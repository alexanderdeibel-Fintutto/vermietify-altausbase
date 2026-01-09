import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, ClipboardList } from 'lucide-react';
import VendorList from '@/components/vendor/VendorList';
import VendorTaskList from '@/components/vendor/VendorTaskList';
import VendorEditDialog from '@/components/vendor/VendorEditDialog';
import VendorTaskDialog from '@/components/vendor/VendorTaskDialog';

export default function VendorManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date', 200)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['vendorTasks'],
    queryFn: () => base44.entities.VendorTask.list('-created_date', 200)
  });

  const activeVendors = vendors.filter(v => v.is_active).length;
  const activeTasks = tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;
  const completedThisMonth = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completed_date) return false;
    const completed = new Date(t.completed_date);
    const now = new Date();
    return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Dienstleister-Verwaltung</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Ihre Service-Partner und Aufträge</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTaskDialog(true)} variant="outline">
            <ClipboardList className="w-4 h-4 mr-2" />
            Neuer Auftrag
          </Button>
          <Button onClick={() => setShowVendorDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Dienstleister
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{activeVendors}</p>
                <p className="text-sm text-slate-600">Aktive Dienstleister</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{activeTasks}</p>
                <p className="text-sm text-slate-600">Laufende Aufträge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{completedThisMonth}</p>
                <p className="text-sm text-slate-600">Diesen Monat erledigt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Dienstleister oder Aufträge suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="vendors" className="w-full">
        <TabsList>
          <TabsTrigger value="vendors">Dienstleister</TabsTrigger>
          <TabsTrigger value="tasks">Aufträge</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <VendorList 
            vendors={vendors} 
            searchQuery={searchQuery}
            onEdit={(vendor) => {
              setSelectedVendor(vendor);
              setShowVendorDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <VendorTaskList 
            tasks={tasks} 
            vendors={vendors}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>

      {showVendorDialog && (
        <VendorEditDialog
          vendor={selectedVendor}
          onClose={() => {
            setShowVendorDialog(false);
            setSelectedVendor(null);
          }}
        />
      )}

      {showTaskDialog && (
        <VendorTaskDialog
          onClose={() => setShowTaskDialog(false)}
        />
      )}
    </div>
  );
}