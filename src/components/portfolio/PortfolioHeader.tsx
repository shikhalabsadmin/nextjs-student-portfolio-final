import React from 'react';
import { PortfolioTheme } from '@/types/portfolio';

interface PortfolioHeaderProps {
  theme?: PortfolioTheme;
}

export const PortfolioHeader = ({ theme }: PortfolioHeaderProps) => {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 
              className="text-3xl font-bold" 
              style={{ fontFamily: theme?.typography?.headingFont }}
            >
              My Portfolio
            </h1>
            <p 
              className="mt-2 text-gray-600" 
              style={{ fontFamily: theme?.typography?.bodyFont }}
            >
              Showcase of your academic journey and achievements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};