import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Camera, Upload } from 'lucide-react';

export default function CreatePostDialog({ tenantId, buildingId, companyId }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contactMethod, setContactMethod] = useState('app_message');
  const [contactInfo, setContactInfo] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const queryClient = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant-info', tenantId],
    queryFn: () => base44.entities.Tenant.read(tenantId)
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (fileUrl) => setUploadedImages([...uploadedImages, fileUrl])
  });

  const createPostMutation = useMutation({
    mutationFn: () =>
      base44.entities.CommunityPost.create({
        tenant_id: tenantId,
        building_id: buildingId,
        company_id: companyId,
        category,
        title,
        content,
        author_name: tenant?.first_name || 'Mieter',
        contact_method: contactMethod,
        contact_info: contactMethod !== 'app_message' ? contactInfo : null,
        images: uploadedImages,
        is_approved: true,
        is_active: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setOpen(false);
      setCategory('general');
      setTitle('');
      setContent('');
      setContactMethod('app_message');
      setContactInfo('');
      setUploadedImages([]);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Beitrag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Beitrag erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm mb-2 block">Kategorie</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roommate_search">Mitbewohner gesucht</SelectItem>
                <SelectItem value="item_offer">Biete an</SelectItem>
                <SelectItem value="item_request">Suche</SelectItem>
                <SelectItem value="event">Nachbarschafts-Event</SelectItem>
                <SelectItem value="tip">Tipp & Empfehlung</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm mb-2 block">Titel</label>
            <Input
              placeholder="z.B. 'Suche Mitbewohner für 2er-WG'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm mb-2 block">Beschreibung</label>
            <Textarea
              placeholder="Details zu Ihrem Anliegen..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm mb-2 block">Kontakt</label>
            <Select value={contactMethod} onValueChange={setContactMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="app_message">Über App-Nachricht</SelectItem>
                <SelectItem value="email">Per E-Mail</SelectItem>
                <SelectItem value="phone">Per Telefon</SelectItem>
              </SelectContent>
            </Select>
            {contactMethod !== 'app_message' && (
              <Input
                className="mt-2"
                placeholder={contactMethod === 'email' ? 'Ihre E-Mail' : 'Ihre Telefonnummer'}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            )}
          </div>

          <div>
            <label className="text-sm mb-2 block">Bilder (optional)</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('post-photo').click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('post-file').click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </Button>
            </div>
            <input
              id="post-photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
              className="hidden"
            />
            <input
              id="post-file"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
              className="hidden"
            />
            {uploadedImages.length > 0 && (
              <p className="text-xs text-green-600 mt-2">✓ {uploadedImages.length} Bild(er) hochgeladen</p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <p className="font-medium text-blue-900 mb-1">🔒 Datenschutz-Hinweis:</p>
            <p className="text-blue-700">
              Nur Mieter Ihres Gebäudes können diesen Beitrag sehen. Ihr voller Name wird nicht angezeigt.
            </p>
          </div>

          <Button
            onClick={() => createPostMutation.mutate()}
            disabled={!title || !content || createPostMutation.isPending}
            className="w-full"
          >
            Beitrag veröffentlichen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}