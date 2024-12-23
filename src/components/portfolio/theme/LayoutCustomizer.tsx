import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { Layout } from '@/types/portfolio';

interface LayoutCustomizerProps {
  layout: Layout;
  onUpdate: (layout: Layout) => void;
  onReset: () => void;
}

export const LayoutCustomizer = ({ layout, onUpdate, onReset }: LayoutCustomizerProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Layout</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Layout
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Style</Label>
          <select
            value={layout.style}
            onChange={(e) =>
              onUpdate({ ...layout, style: e.target.value as Layout['style'] })
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="minimal">Minimal</option>
            <option value="creative">Creative</option>
            <option value="academic">Academic</option>
          </select>
        </div>
        <div>
          <Label>Spacing</Label>
          <select
            value={layout.spacing}
            onChange={(e) =>
              onUpdate({ ...layout, spacing: e.target.value as Layout['spacing'] })
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="tight">Tight</option>
            <option value="balanced">Balanced</option>
            <option value="airy">Airy</option>
          </select>
        </div>
      </div>
    </div>
  );
};