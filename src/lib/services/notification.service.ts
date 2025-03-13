import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 
  | 'ASSIGNMENT_SUBMITTED'
  | 'ASSIGNMENT_VERIFIED'
  | 'ASSIGNMENT_NEEDS_REVISION'
  | 'ASSIGNMENT_REJECTED'
  | 'GENERAL';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Subscribe to real-time notifications for a user
  subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void): () => void {
    // Unsubscribe from any existing subscription for this user
    this.unsubscribeFromNotifications(userId);

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();

    // Store the unsubscribe function
    this.subscriptions.set(userId, () => {
      subscription.unsubscribe();
    });

    return () => this.unsubscribeFromNotifications(userId);
  }

  // Unsubscribe from notifications for a user
  unsubscribeFromNotifications(userId: string) {
    const unsubscribe = this.subscriptions.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(userId);
    }
  }

  // Get unread notifications for a user
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data;
  }

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Create a notification for assignment submission
  async notifyAssignmentSubmitted(teacherId: string, assignmentTitle: string, studentName: string, assignmentId: string): Promise<void> {
    await supabase.rpc('create_notification', {
      p_user_id: teacherId,
      p_title: 'New Assignment Submission',
      p_message: `${studentName} has submitted the assignment "${assignmentTitle}"`,
      p_type: 'ASSIGNMENT_SUBMITTED',
      p_data: { assignmentId }
    });
  }

  // Create a notification for assignment verification
  async notifyAssignmentVerified(studentId: string, assignmentTitle: string, assignmentId: string): Promise<void> {
    await supabase.rpc('create_notification', {
      p_user_id: studentId,
      p_title: 'Assignment Verified',
      p_message: `Your assignment "${assignmentTitle}" has been verified`,
      p_type: 'ASSIGNMENT_VERIFIED',
      p_data: { assignmentId }
    });
  }

  // Create a notification for assignment needing revision
  async notifyAssignmentNeedsRevision(studentId: string, assignmentTitle: string, feedback: string, assignmentId: string): Promise<void> {
    await supabase.rpc('create_notification', {
      p_user_id: studentId,
      p_title: 'Assignment Needs Revision',
      p_message: `Your assignment "${assignmentTitle}" needs revision: ${feedback}`,
      p_type: 'ASSIGNMENT_NEEDS_REVISION',
      p_data: { assignmentId, feedback }
    });
  }

  // Create a notification for assignment rejection
  async notifyAssignmentRejected(studentId: string, assignmentTitle: string, reason: string, assignmentId: string): Promise<void> {
    await supabase.rpc('create_notification', {
      p_user_id: studentId,
      p_title: 'Assignment Rejected',
      p_message: `Your assignment "${assignmentTitle}" has been rejected: ${reason}`,
      p_type: 'ASSIGNMENT_REJECTED',
      p_data: { assignmentId, reason }
    });
  }
} 