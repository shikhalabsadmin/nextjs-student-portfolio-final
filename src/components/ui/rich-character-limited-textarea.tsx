import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from '@/components/rich-text-editor/Toolbar';
import { useState } from 'react';

interface RichCharacterLimitedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  suggestedLength?: number;
  currentLength?: number;
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
}

// Helper function to get text content from HTML
const getTextContent = (html: string): string => {
  if (!html || html === '<p></p>') return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export function RichCharacterLimitedTextarea({
  value,
  onChange,
  onBlur,
  maxLength = 2000,
  suggestedLength = 1500,
  currentLength = 0,
  placeholder,
  name,
  required,
  className,
}: RichCharacterLimitedTextareaProps) {
  const [linkUrl, setLinkUrl] = useState('');
  
  // Get form context to check for errors
  const formContext = useFormContext();
  const hasError = name && formContext?.formState?.errors?.[name];

  // Create editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Clear error when user starts typing
      if (hasError && name && formContext && html !== '<p></p>') {
        formContext.clearErrors(name);
      }
      
      onChange(html);
    },
    onBlur: () => {
      if (onBlur) {
        onBlur();
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[200px] px-4 py-3',
          hasError && 'border-red-500 ring-red-500 focus-visible:ring-red-500'
        ),
      },
    },
  });

  // Add placeholder styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: #adb5bd;
        pointer-events: none;
        height: 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Update editor content when value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
    }
  };

  // Calculate text-only length for character counting
  const textContent = getTextContent(value);
  const actualLength = textContent.length;
  
  const isOverMax = actualLength > maxLength;
  const isOverSuggested = suggestedLength && actualLength > suggestedLength;

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(
        "border rounded-md overflow-hidden",
        hasError && "border-red-500 ring-red-500 focus-within:ring-red-500 bg-red-50"
      )}>
        <Toolbar
          editor={editor}
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          addLink={addLink}
        />
        <EditorContent 
          editor={editor} 
          className="min-h-[200px] focus-within:outline-none"
        />
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="space-x-2">
          {hasError && (
            <span className="text-red-500 font-medium">
              This field is required
            </span>
          )}
          {suggestedLength && (
            <span className={cn(
              isOverSuggested && !isOverMax && "text-yellow-600",
              isOverMax && "text-red-600"
            )}>
              Suggested: {suggestedLength} characters
            </span>
          )}
        </div>
        <span className={cn(
          isOverMax && "text-red-600",
          isOverSuggested && !isOverMax && "text-yellow-600"
        )}>
          {actualLength}/{maxLength}
        </span>
      </div>
    </div>
  );
} 