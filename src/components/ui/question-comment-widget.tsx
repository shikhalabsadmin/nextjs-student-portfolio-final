import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Check, Edit2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionComment {
  id: string;
  questionId: string;
  comment: string;
  timestamp: string;
}

interface QuestionCommentWidgetProps {
  questionId: string;
  existingComment?: QuestionComment;
  onCommentSave?: (questionId: string, comment: string) => void;
  onCommentDelete?: (questionId: string) => void;
  className?: string;
}

export const QuestionCommentWidget = ({
  questionId,
  existingComment,
  onCommentSave,
  onCommentDelete,
  className
}: QuestionCommentWidgetProps) => {
  console.log("[QuestionCommentWidget] Rendered with:", { questionId, existingComment });

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingComment);
  const [comment, setComment] = useState(existingComment?.comment || "");
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        console.log("[QuestionCommentWidget] Escape pressed, closing");
        setIsOpen(false);
      }
    };

    if (isOpen) {
      console.log("[QuestionCommentWidget] Adding escape key listener");
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        console.log("[QuestionCommentWidget] Removing escape key listener");
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    console.log("[QuestionCommentWidget] Explicitly closing popover");
    setIsOpen(false);
  };

  // Auto-focus textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      console.log("[QuestionCommentWidget] Auto-focusing textarea");
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleOpen = () => {
    console.log("[QuestionCommentWidget] Opening popover");
    setIsOpen(true);
    // If opening in edit mode, focus the textarea
    if (!existingComment) {
      setTimeout(() => {
        if (textareaRef.current) {
          console.log("[QuestionCommentWidget] Auto-focusing textarea on open");
          textareaRef.current.focus();
        }
      }, 100);
    }
  };

  const handleEdit = () => {
    console.log("[QuestionCommentWidget] Starting edit mode");
    setIsEditing(true);
    // Force focus after a small delay
    setTimeout(() => {
      if (textareaRef.current) {
        console.log("[QuestionCommentWidget] Manually focusing textarea");
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleSave = () => {
    console.log("[QuestionCommentWidget] Saving comment:", comment);
    if (comment.trim() && onCommentSave) {
      onCommentSave(questionId, comment.trim());
      setIsEditing(false);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    console.log("[QuestionCommentWidget] Canceling edit");
    setComment(existingComment?.comment || "");
    setIsEditing(!existingComment);
    if (!existingComment) {
      setIsOpen(false);
    }
  };

  const handleDelete = () => {
    console.log("[QuestionCommentWidget] Deleting comment");
    if (onCommentDelete) {
      onCommentDelete(questionId);
      setIsOpen(false);
    }
  };

  const hasComment = existingComment && existingComment.comment.trim();

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className={cn(
          "h-8 w-8 p-0 rounded-full transition-colors relative",
          hasComment 
            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
          className
        )}
        title={hasComment ? "View/Edit Comment" : "Add Comment"}
      >
        <MessageCircle className="h-4 w-4" />
        {hasComment && (
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
        )}
      </Button>

      {/* Simple Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-8 right-0 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-10"
          style={{
            maxHeight: '40vh',
            overflow: 'hidden',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            console.log("[QuestionCommentWidget] Popover clicked");
            e.stopPropagation();
          }}
        >
          <div 
            className="p-4 space-y-3"
            onClick={(e) => {
              console.log("[QuestionCommentWidget] Content div clicked");
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-slate-900">
                Question Comment
              </h4>
              <div className="flex items-center gap-1">
                {hasComment && !isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {onCommentDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
                {/* Always show close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                  title="Close (Esc)"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

                          {/* Content */}
              {isEditing ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600">
                    Click in the text area below to start typing:
                  </div>
                              <Textarea
                ref={textareaRef}
                value={comment}
                onChange={(e) => {
                  console.log("[QuestionCommentWidget] Textarea value changed:", e.target.value);
                  setComment(e.target.value);
                }}
                onClick={(e) => {
                  console.log("[QuestionCommentWidget] Textarea clicked");
                  e.stopPropagation();
                }}
                onFocus={(e) => {
                  console.log("[QuestionCommentWidget] Textarea focused");
                }}
                onMouseDown={(e) => {
                  console.log("[QuestionCommentWidget] Textarea mouse down");
                  e.stopPropagation();
                }}
                placeholder="Add your comment about this question..."
                className="min-h-[80px] resize-none text-sm"
                maxLength={500}
                style={{
                  pointerEvents: 'auto',
                  zIndex: 1
                }}
              />
                <div className="text-xs text-slate-500 text-right">
                  {comment.length}/500
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!comment.trim()}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
                </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md">
                  {existingComment?.comment}
                </div>
                <div className="text-xs text-slate-500">
                  Added {existingComment?.timestamp && new Date(existingComment.timestamp).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 