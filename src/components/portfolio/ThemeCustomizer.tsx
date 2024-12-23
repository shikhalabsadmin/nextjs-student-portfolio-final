import React from 'react';
import { useThemeManager } from '@/hooks/useThemeManager';
import { ColorCustomizer } from './theme/ColorCustomizer';
import { TypographyCustomizer } from './theme/TypographyCustomizer';
import { LayoutCustomizer } from './theme/LayoutCustomizer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const ThemeCustomizer = () => {
  const {
    theme,
    isLoading,
    updateTheme,
    resetSection,
    saveChanges,
    hasUnsavedChanges,
  } = useThemeManager();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ColorCustomizer 
        colors={theme.colors}
        onUpdate={(colors) => updateTheme('colors', colors)}
        onReset={() => resetSection('colors')}
      />
      <TypographyCustomizer 
        typography={theme.typography}
        onUpdate={(typography) => updateTheme('typography', typography)}
        onReset={() => resetSection('typography')}
      />
      <LayoutCustomizer 
        layout={theme.layout}
        onUpdate={(layout) => updateTheme('layout', layout)}
        onReset={() => resetSection('layout')}
      />
      
      {hasUnsavedChanges && (
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Discard Changes
          </Button>
          <Button
            onClick={saveChanges}
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};