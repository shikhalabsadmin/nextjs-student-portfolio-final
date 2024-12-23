import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { Typography } from '@/types/portfolio';

interface TypographyCustomizerProps {
  typography: Typography;
  onUpdate: (typography: Typography) => void;
  onReset: () => void;
}

export const TypographyCustomizer = ({ typography, onUpdate, onReset }: TypographyCustomizerProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Typography</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Typography
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Scale</Label>
          <select
            value={typography.scale}
            onChange={(e) =>
              onUpdate({ ...typography, scale: e.target.value as Typography['scale'] })
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="compact">Compact</option>
            <option value="regular">Regular</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
        <div>
          <Label>Body Font</Label>
          <select
            value={typography.bodyFont}
            onChange={(e) =>
              onUpdate({ ...typography, bodyFont: e.target.value })
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
          </select>
        </div>
        <div>
          <Label>Heading Font</Label>
          <select
            value={typography.headingFont}
            onChange={(e) =>
              onUpdate({ ...typography, headingFont: e.target.value })
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
          </select>
        </div>
      </div>
    </div>
  );
};