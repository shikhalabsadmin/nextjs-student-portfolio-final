import React from 'react';
import { Button } from '@/components/ui/button';

interface ToolbarButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const ToolbarButton = ({ isActive, onClick, children }: ToolbarButtonProps) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={isActive ? 'bg-gray-200' : ''}
  >
    {children}
  </Button>
);