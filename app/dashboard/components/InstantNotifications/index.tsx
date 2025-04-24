import { BellIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationService, Notification } from "@/lib/api/api";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "../types";

interface NotificationsProps {
  user: User | null;
}

export function InstantNotifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      const data = await NotificationService.getUserNotifications(
        user.id,
        "instant"
      );
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    };

    loadNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `to_user=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleNotificationClick = async (notification: Notification) => {
    await NotificationService.markAsRead(notification.id);
    setUnreadCount((prev) => prev - 1);
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-96 overflow-y-auto"
        align="end"
      >
        {notifications.length === 0 ? (
          <DropdownMenuItem className="text-muted-foreground text-sm">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`py-3 ${!notification.is_read ? "bg-muted/50" : ""}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm">{notification.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
