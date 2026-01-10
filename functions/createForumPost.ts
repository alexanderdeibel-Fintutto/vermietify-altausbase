import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = await req.json();

  await base44.entities.BuildingBoardPost.create({
    author_email: user.email,
    author_name: user.full_name,
    author_type: user.role === 'admin' ? 'admin' : 'tenant',
    title: 'Forum-Beitrag',
    content,
    post_type: 'general',
    likes: 0
  });

  return Response.json({ success: true });
});