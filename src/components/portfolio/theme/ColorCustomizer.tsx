import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { ThemeColors } from '@/types/portfolio';

interface ColorCustomizerProps {
  colors: ThemeColors;
  onUpdate: (colors: ThemeColors) => void;
  onReset: () => void;
}

export const ColorCustomizer = ({ colors, onUpdate, onReset }: ColorCustomizerProps) => {
  const validateColor = (color: string) => {
    return color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    if (validateColor(value)) {
      onUpdate({ ...colors, [key]: value });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Colors</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Colors
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(colors).map(([key, value]) => (
          <div key={key}>
            <Label>{key}</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                className="w-12 h-12 p-1"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                className={`flex-1 ${!validateColor(value) ? 'border-red-500' : ''}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};