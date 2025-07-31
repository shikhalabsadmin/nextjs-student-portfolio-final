import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Edit2, Check, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";
import { Textarea } from "./textarea";

interface QuestionCommentWidgetProps {
  questionId: string;
  existingComment?: { comment: string; timestamp: string; teacher_id: string } | null;
  onCommentChange: (questionId: string, comment: string | null) => void;
  disabled?: boolean;
}

export function QuestionCommentWidget({
  questionId,
  existingComment,
  onCommentChange,
  disabled = false,
}: QuestionCommentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState(existingComment?.comment || "");
  const [isEditing, setIsEditing] = useState(!existingComment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!existingComment) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSave = () => {
    if (comment.trim()) {
      onCommentChange(questionId, comment.trim());
      setIsEditing(false);
    } else {
      handleDelete();
    }
  };

  const handleCancel = () => {
    setComment(existingComment?.comment || "");
    setIsEditing(false);
    if (!existingComment) {
      setIsOpen(false);
    }
  };

  const handleDelete = () => {
    setComment("");
    onCommentChange(questionId, null);
    setIsEditing(false);
    setIsOpen(false);
  };

  const hasComment = !!existingComment?.comment;

  return (
    <div className="flex items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasComment ? "default" : "outline"}
            size="sm"
            className={`
              relative h-6 w-6 p-0 rounded-full shrink-0
              ${hasComment 
                ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
                : "bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600 border-gray-300"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            onClick={handleOpen}
            disabled={disabled}
          >
            <MessageCircle className="h-3 w-3" />
            {hasComment && (
              <Badge 
                className="absolute -top-1 -right-1 h-3 w-3 p-0 text-[8px] bg-red-500 text-white border-white"
              >
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Teacher Comment</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {isEditing ? (
              <>
                <Textarea
                  ref={textareaRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Add a comment for this question..."
                  className="min-h-[80px] text-sm resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {comment.length}/500 characters
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </>
            ) : existingComment ? (
              <>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                  {existingComment.comment}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {new Date(existingComment.timestamp).toLocaleDateString()} at{' '}
                    {new Date(existingComment.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No comment added yet.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 