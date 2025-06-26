import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Loader2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useAuthState } from "@/hooks/useAuthState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const AssignmentsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const { user, profile } = useAuthState();
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', selectedStatus, profile?.grade],
    queryFn: async () => {
      console.log('[AssignmentsList] Fetching assignments:', {
        status: selectedStatus,
        grade: profile?.grade,
        userId: user?.id
      });

      let query = supabase
        .from('assignments')
        .select(`
          *,
          profiles!assignments_student_id_fkey (full_name)
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (profile?.grade) {
        query = query.eq('grade', profile.grade);
      }

      if (selectedStatus) {
        query = query.eq('status', selectedStatus?.toUpperCase());
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[AssignmentsList] Query error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .rpc('delete_assignment', {
          assignment_id: assignmentId,
          user_id: user.id
        });

      if (error) throw error;
      if (!data) throw new Error('Failed to delete assignment');
      
      return data;
    },
    onMutate: async (assignmentId) => {
      // Cancel any outgoing refetches for this specific query
      await queryClient.cancelQueries({ 
        queryKey: ['assignments', selectedStatus, profile?.grade]
      });

      // Snapshot the previous value
      const previousAssignments = queryClient.getQueryData(['assignments', selectedStatus, profile?.grade]);

      // Optimistically update the cache
      queryClient.setQueryData(['assignments', selectedStatus, profile?.grade], (old: any[]) => 
        old?.filter(assignment => assignment.id !== assignmentId) || []
      );

      return { previousAssignments };
    },
    onError: (err, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousAssignments) {
        queryClient.setQueryData(['assignments', selectedStatus, profile?.grade], context.previousAssignments);
      }
      console.error('Error deleting draft:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete draft. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Draft deleted successfully',
        duration: 3000,
      });
    },
    onSettled: async () => {
      // Close the dialog
      setAssignmentToDelete(null);
      
      // Only invalidate and refetch the specific assignments query
      await queryClient.invalidateQueries({ 
        queryKey: ['assignments', selectedStatus, profile?.grade]
      });
    }
  });

  // Add an effect to handle query invalidation on route changes
  useEffect(() => {
    const resetQueries = async () => {
      await queryClient.resetQueries();
      await queryClient.invalidateQueries();
    };
    resetQueries();
  }, [location.pathname, queryClient]);

  const handleStatusChange = async (status: string | null) => {
    setSelectedStatus(status);
    // Force a fresh fetch when changing status
    await queryClient.resetQueries();
    await queryClient.invalidateQueries();
  };

  const handleDeleteDraft = async () => {
    if (!assignmentToDelete) return;
    deleteMutation.mutate(assignmentToDelete);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-50 text-blue-700';
      case 'needs_revision':
        return 'bg-yellow-50 text-yellow-700';
      case 'verified':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = (assignment: any) => {
    const isDraft = assignment.status.toLowerCase() === 'draft';
    
    if (isDraft) {
      console.log('[NAVIGATE] Draft data:', {
        id: assignment.id,
        title: assignment.title,
        artifact_type: assignment.artifact_type,
        raw: assignment
      });
      navigate(`/app/submit?id=${assignment.id}`, {
        state: {
          draftData: assignment
        }
      });
    } else {
      // For submitted assignments, show the view-only version
      navigate(`/app/assignments/${assignment.id}/view`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={selectedStatus === null ? "default" : "outline"}
          onClick={() => handleStatusChange(null)}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={selectedStatus === "draft" ? "default" : "outline"}
          onClick={() => handleStatusChange("draft")}
          size="sm"
        >
          Drafts
        </Button>
        <Button
          variant={selectedStatus === "submitted" ? "default" : "outline"}
          onClick={() => handleStatusChange("submitted")}
          size="sm"
        >
          Submitted
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          {/* Header */}
          <div className="grid grid-cols-[1fr,100px,100px,100px,48px] gap-4 px-4 py-3 border-b bg-muted/50">
            <div className="text-sm font-medium">Title</div>
            <div className="text-sm font-medium">Subject</div>
            <div className="text-sm font-medium">Status</div>
            <div className="text-sm font-medium">Created</div>
            <div></div> {/* Space for actions */}
          </div>

          {/* Rows */}
          <div className="divide-y">
            {assignments?.map((assignment) => {
              const isDraft = assignment.status.toLowerCase() === 'draft';
              
              return (
                <div
                  key={assignment.id}
                  className="grid grid-cols-[1fr,100px,100px,100px,48px] gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer items-center"
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('.kebab-menu')) {
                      handleCardClick(assignment);
                    }
                  }}
                >
                  <div className="font-medium truncate">
                    {assignment.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {assignment.subject}
                  </div>
                  <div>
                    <Badge 
                      variant="secondary"
                      className={getStatusBadgeStyle(assignment.status)}
                    >
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(assignment.created_at), "MMM d, yyyy")}
                  </div>
                  <div className="flex justify-end">
                    {isDraft && (
                      <div className="kebab-menu" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignmentToDelete(assignment.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AlertDialog open={!!assignmentToDelete} onOpenChange={() => setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDraft} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 