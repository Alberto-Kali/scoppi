import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationService, Notification } from "@/lib/api/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "../types";

interface NotificationsProps {
  user: User | null;
}

export function InvitationsWidget({ user }: NotificationsProps) {
  const [invites, setInvites] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    const loadInvites = async () => {
      setIsLoading(true);
      const data = await NotificationService.getUserNotifications(
        user.id,
        "invite"
      );
      setInvites(data);
      setIsLoading(false);
    };

    loadInvites();

    // Real-time updates
    const channel = supabase
      .channel("invites")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `to_user=eq.${user.id},type=eq.invite`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setInvites((prev) => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setInvites((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleAccept = async (invite: Notification) => {
    // Implement team join logic here
    console.log("Accepting invite to team:", invite.metadata.teamId);
    await NotificationService.deleteNotification(invite.id);
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    router.push(`/dashboard?team=${invite.metadata.teamId}`);
  };

  const handleDecline = async (invite: Notification) => {
    await NotificationService.deleteNotification(invite.id);
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
  };

  return (
    <Card className="col-span-3 w-full">
      <CardHeader>
        <CardTitle>Приглашения в команду</CardTitle>
        <CardDescription>Активные запросы на прием в состав</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет приглашений
              </p>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <h3 className="font-medium">{invite.content}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invite.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecline(invite)}
                    >
                      Отклонить
                    </Button>
                    <Button size="sm" onClick={() => handleAccept(invite)}>
                      Принять
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
