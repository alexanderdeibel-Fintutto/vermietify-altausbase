import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Plus, Heart, MessageSquare, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CommunityForum() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin';

  const categories = [
    { id: 'all', label: 'Alle Posts', count: 24 },
    { id: 'pending', label: 'Zur Genehmigung', count: 3 },
    { id: 'roommate', label: 'Mitbewohner', count: 8 },
    { id: 'items', label: 'Gegenstände', count: 12 },
    { id: 'events', label: 'Events', count: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Community-Forum</h1>
          <p className="text-slate-600 font-light mt-2">Mieter-Austausch und Gemeinschaftsposts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kategorien */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kategorien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{cat.label}</span>
                    <span className="text-xs">{cat.count}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="lg:col-span-3 space-y-4">
          {isAdmin && selectedCategory === 'pending' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800 mb-3">3 Posts warten auf Genehmigung</p>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="pending">Moderations-Queue</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="space-y-3">
                    {[1, 2, 3].map(id => (
                      <Card key={id}>
                        <CardContent className="pt-4">
                          <h3 className="font-medium text-sm mb-2">Post {id}</h3>
                          <p className="text-xs text-slate-600 mb-3">Kurze Vorschau des Inhalts...</p>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                              <Check className="w-3 h-3 mr-1" />
                              Genehmigen
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-red-600">
                              <X className="w-3 h-3 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Post List */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map(id => (
              <Card key={id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900">Post Titel {id}</h3>
                      <p className="text-xs text-slate-500 mt-1">von Mieter • vor 2 Tagen</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Kategorie</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Kurze Beschreibung des Posts mit einer Vorschau des Inhalts...</p>
                  <div className="flex gap-4 text-xs text-slate-600">
                    <button className="flex items-center gap-1 hover:text-slate-900">
                      <Heart className="w-4 h-4" />
                      12 Likes
                    </button>
                    <button className="flex items-center gap-1 hover:text-slate-900">
                      <MessageSquare className="w-4 h-4" />
                      5 Kommentare
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}