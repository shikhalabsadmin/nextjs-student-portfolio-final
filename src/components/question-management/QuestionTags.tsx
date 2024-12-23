import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestionTagsProps {
  tags: string[];
  onRemove?: (tag: string) => void;
  onAdd?: (tag: string) => void;
}

export const QuestionTags = ({ tags, onRemove, onAdd }: QuestionTagsProps) => {
  const [newTag, setNewTag] = React.useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim() && onAdd) {
      onAdd(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag}
            {onRemove && (
              <button
                onClick={() => onRemove(tag)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {onAdd && (
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag..."
          className="w-full p-2 border rounded-lg text-sm"
        />
      )}
    </div>
  );
};