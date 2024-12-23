import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LinkDialogProps {
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  addLink: () => void;
}

export const LinkDialog = ({ linkUrl, setLinkUrl, addLink }: LinkDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm">
        <LinkIcon className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Link</DialogTitle>
      </DialogHeader>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        <Button onClick={addLink}>Add</Button>
      </div>
    </DialogContent>
  </Dialog>
);