import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const themes = [
      {
        name: 'Light',
        key: 'light',
        is_system_theme: true,
        is_default: true,
        description: 'Helles Standard-Theme',
        design_tokens: {
          colors: {
            primary_50: '#f8fafc',
            primary_100: '#f1f5f9',
            primary_200: '#e2e8f0',
            primary_300: '#cbd5e1',
            primary_400: '#94a3b8',
            primary_500: '#64748b',
            primary_600: '#475569',
            primary_700: '#334155',
            primary_800: '#1e293b',
            primary_900: '#0f172a',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
          },
          typography: {
            font_family_primary: 'Montserrat, sans-serif',
            font_weight_extralight: '300',
            font_weight_light: '300',
            font_weight_normal: '400',
            font_weight_medium: '500',
            font_weight_semibold: '600',
            font_weight_bold: '700',
          },
          effects: {
            radius_sm: '0.375rem',
            radius_md: '0.5rem',
            radius_lg: '0.75rem',
            radius_xl: '1rem',
            transition_fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
            transition_normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      {
        name: 'Dark',
        key: 'dark',
        is_system_theme: true,
        is_default: false,
        description: 'Dunkles Theme für die Nacht',
        design_tokens: {
          colors: {
            primary_50: '#0f172a',
            primary_100: '#1e293b',
            primary_200: '#334155',
            primary_300: '#475569',
            primary_400: '#64748b',
            primary_500: '#94a3b8',
            primary_600: '#cbd5e1',
            primary_700: '#e2e8f0',
            primary_800: '#f1f5f9',
            primary_900: '#f8fafc',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
          },
          typography: {
            font_family_primary: 'Montserrat, sans-serif',
            font_weight_extralight: '300',
            font_weight_light: '300',
            font_weight_normal: '400',
            font_weight_medium: '500',
            font_weight_semibold: '600',
            font_weight_bold: '700',
          },
          effects: {
            radius_sm: '0.375rem',
            radius_md: '0.5rem',
            radius_lg: '0.75rem',
            radius_xl: '1rem',
            transition_fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
            transition_normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      {
        name: 'System',
        key: 'system',
        is_system_theme: true,
        is_default: false,
        description: 'Folgt der Browser/OS Dark-Mode Einstellung',
        design_tokens: {
          colors: {
            primary_50: '#f8fafc',
            primary_100: '#f1f5f9',
            primary_200: '#e2e8f0',
            primary_300: '#cbd5e1',
            primary_400: '#94a3b8',
            primary_500: '#64748b',
            primary_600: '#475569',
            primary_700: '#334155',
            primary_800: '#1e293b',
            primary_900: '#0f172a',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
          },
          typography: {
            font_family_primary: 'Montserrat, sans-serif',
            font_weight_extralight: '300',
            font_weight_light: '300',
            font_weight_normal: '400',
            font_weight_medium: '500',
            font_weight_semibold: '600',
            font_weight_bold: '700',
          },
          effects: {
            radius_sm: '0.375rem',
            radius_md: '0.5rem',
            radius_lg: '0.75rem',
            radius_xl: '1rem',
            transition_fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
            transition_normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    ];

    // Create themes
    const existingThemes = await base44.asServiceRole.entities.Theme.list();
    for (const theme of themes) {
      const exists = existingThemes.some(t => t.key === theme.key);
      if (!exists) {
        await base44.asServiceRole.entities.Theme.create(theme);
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Default themes seeded successfully',
      count: themes.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});