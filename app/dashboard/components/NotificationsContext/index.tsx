import { createContext, useContext, useEffect, useState } from "react";
import { NotificationService, Notification } from "@/lib/api/api";
import { supabase } from "@/lib/supabaseClient";
import { User } from "../types";

type NotificationContextType = {
  notifications: Notification[];
  invites: Notification[];
  moderations: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  createNotification: (
    toUser: string,
    content: string,
    type: "instant" | "invite" | "moderation",
    metadata?: any,
    actionUrl?: string,
    senderId?: string
  ) => Promise<Notification | null>;
};

interface NotificationsProps {
  user: User | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider(
  { user }: NotificationsProps,
  { children }: { children: React.ReactNode }
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invites, setInvites] = useState<Notification[]>([]);
  const [moderations, setModerations] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadAllNotifications = async () => {
      const [instants, inviteList, moderationList] = await Promise.all([
        NotificationService.getUserNotifications(user.id, "instant"),
        NotificationService.getUserNotifications(user.id, "invite"),
        NotificationService.getUserNotifications(user.id, "moderation"),
      ]);

      setNotifications(instants);
      setInvites(inviteList);
      setModerations(moderationList);
      setUnreadCount(instants.filter((n) => !n.is_read).length);
    };

    loadAllNotifications();

    // Real-time subscription for all notification types
    const channel = supabase
      .channel("all_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `to_user=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;

          if (payload.eventType === "INSERT") {
            if (notification.type === "instant") {
              setNotifications((prev) => [notification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            } else if (notification.type === "invite") {
              setInvites((prev) => [notification, ...prev]);
            } else if (notification.type === "moderation") {
              setModerations((prev) => [notification, ...prev]);
            }
          } else if (payload.eventType === "DELETE") {
            if (payload.old.type === "instant") {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== payload.old.id)
              );
            } else if (payload.old.type === "invite") {
              setInvites((prev) => prev.filter((i) => i.id !== payload.old.id));
            } else if (payload.old.type === "moderation") {
              setModerations((prev) =>
                prev.filter((m) => m.id !== payload.old.id)
              );
            }
          } else if (payload.eventType === "UPDATE") {
            if (payload.new.type === "instant") {
              setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? notification : n))
              );
              if (notification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: number) => {
    await NotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const deleteNotification = async (id: number) => {
    await NotificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setInvites((prev) => prev.filter((i) => i.id !== id));
    setModerations((prev) => prev.filter((m) => m.id !== id));
  };

  const createNotification = async (
    toUser: string,
    content: string,
    type: "instant" | "invite" | "moderation",
    metadata?: any,
    actionUrl?: string,
    senderId?: string
  ) => {
    return NotificationService.createNotification(
      toUser,
      content,
      type,
      metadata,
      actionUrl,
      senderId
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        invites,
        moderations,
        unreadCount,
        markAsRead,
        deleteNotification,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
