import React, { useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "@/hooks/useAuthState";
import { NotificationService } from "@/lib/services/notification.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export const NotificationBell = () => {
  const { user } = useAuthState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationService = NotificationService.getInstance();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => user ? notificationService.getUnreadNotifications(user.id) : Promise.resolve([]),
    enabled: !!user,
    initialData: []
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = notificationService.subscribeToNotifications(user.id, (newNotification) => {
      // Update the notifications cache with the new notification
      queryClient.setQueryData(['notifications', user.id], (old: typeof notifications = []) => {
        return [newNotification, ...old];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user, queryClient]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Mark as read
    await notificationService.markAsRead(notification.id);

    // Remove from the notifications list
    queryClient.setQueryData(['notifications', user?.id], (old: typeof notifications = []) => {
      return old.filter(n => n.id !== notification.id);
    });

    // Navigate based on notification type and data
    if (notification.type.startsWith('ASSIGNMENT_') && notification.data?.assignmentId) {
      navigate(`/assignments/${notification.data.assignmentId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative">
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {notifications.length}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="p-4 cursor-pointer"
            >
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-gray-500">{notification.message}</p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            No new notifications
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};