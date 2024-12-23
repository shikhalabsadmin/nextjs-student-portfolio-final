import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PortfolioTheme, ThemeColors, Typography, Layout } from '@/types/portfolio';

const defaultTheme: PortfolioTheme = {
  colors: {
    text: "#111827",
    accent: "#3b82f6",
    primary: "#2563eb",
    secondary: "#1e40af",
    background: "#f9fafb"
  },
  typography: {
    scale: "regular",
    bodyFont: "Inter",
    headingFont: "Inter"
  },
  layout: {
    style: "minimal",
    spacing: "balanced"
  }
};

export const useThemeManager = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<PortfolioTheme>(defaultTheme);

  // Fetch theme from Supabase
  const { data: theme, isLoading } = useQuery({
    queryKey: ['portfolio-theme'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('portfolio_themes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return {
        colors: data.colors as ThemeColors,
        typography: data.typography as Typography,
        layout: data.layout as Layout,
      } as PortfolioTheme;
    },
  });

  // Update theme in Supabase
  const mutation = useMutation({
    mutationFn: async (newTheme: PortfolioTheme) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('portfolio_themes')
        .update({
          colors: newTheme.colors,
          typography: newTheme.typography,
          layout: newTheme.layout,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Theme updated successfully');
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast.error('Failed to update theme');
      console.error('Theme update error:', error);
    },
  });

  // Update theme with validation
  const updateTheme = (section: keyof PortfolioTheme, value: any) => {
    if (section === 'colors') {
      // Validate hex colors
      const invalidColors = Object.entries(value).filter(([_, color]) => {
        return typeof color === 'string' && !color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
      });
      
      if (invalidColors.length > 0) {
        toast.error('Invalid color format. Please use hex colors (e.g., #FF0000)');
        return;
      }
    }

    setCurrentTheme(prev => ({ ...prev, [section]: value }));
    setHasUnsavedChanges(true);
  };

  // Reset section to default
  const resetSection = (section: keyof PortfolioTheme) => {
    setCurrentTheme(prev => ({ ...prev, [section]: defaultTheme[section] }));
    setHasUnsavedChanges(true);
  };

  // Save changes
  const saveChanges = () => {
    mutation.mutate(currentTheme);
  };

  // Load theme presets
  const loadPreset = (preset: PortfolioTheme) => {
    setCurrentTheme(preset);
    setHasUnsavedChanges(true);
  };

  // Initialize current theme
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    theme: currentTheme,
    isLoading,
    updateTheme,
    resetSection,
    saveChanges,
    loadPreset,
    hasUnsavedChanges,
    defaultTheme,
  };
};