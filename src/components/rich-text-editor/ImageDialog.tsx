import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ImageDialogProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  addImage: () => void;
}

export const ImageDialog = ({ imageUrl, setImageUrl, addImage }: ImageDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm">
        <ImageIcon className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Image</DialogTitle>
      </DialogHeader>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <Button onClick={addImage}>Add</Button>
      </div>
    </DialogContent>
  </Dialog>
);