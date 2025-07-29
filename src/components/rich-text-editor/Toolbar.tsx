import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Quote,
  Heading1, Heading2, Code, Undo, Redo,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { LinkDialog } from './LinkDialog';

interface ToolbarProps {
  editor: Editor;
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  addLink: () => void;
}

export const Toolbar = ({
  editor,
  linkUrl,
  setLinkUrl,
  addLink,
}: ToolbarProps) => (
  <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-2">
    <div className="flex gap-1 border-r pr-2">
      <ToolbarButton
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
    </div>

    <div className="flex gap-1 border-r pr-2">
      <ToolbarButton
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
    </div>

    <div className="flex gap-1 border-r pr-2">
      <ToolbarButton
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
    </div>

    <div className="flex gap-1 border-r pr-2">
      <LinkDialog
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        addLink={addLink}
      />
    </div>

    <div className="flex gap-1">
      <ToolbarButton
        isActive={false}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={false}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  </div>
);