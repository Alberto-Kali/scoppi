import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NotificationService,
  Notification,
  addUserToTeam,
  fetchUserProfile,
  getTeamByID,
  getCompetitions,
} from "@/lib/api/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

import { User } from "../types";
import { toast } from "sonner";

interface NotificationsProps {
  user: User | null;
}

export function ModerationWidget({ user }: NotificationsProps) {
  const [moderations, setModerations] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    const loadModerations = async () => {
      setIsLoading(true);
      const data = await NotificationService.getUserNotifications(
        user.id,
        "moderation"
      );
      setModerations(data);
      setIsLoading(false);
    };

    loadModerations();

    const channel = supabase
      .channel("moderations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `to_user=eq.${user.id},type=eq.moderation`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setModerations((prev) => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setModerations((prev) =>
              prev.filter((m) => m.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleApprove = async (moderation: Notification) => {
    try {
      if (
        moderation.metadata["actionType"] === "team_join" &&
        moderation.sender_id
      ) {
        const teamId = moderation.metadata["entityId"];
        const senderId = moderation.sender_id;

        const [team, sender, currentUser] = await Promise.all([
          getTeamByID(teamId),
          fetchUserProfile(senderId),
          fetchUserProfile(user?.id || ""),
        ]);

        if (!sender?.class || !currentUser?.class || !team?.requiredRoles) {
          throw new Error("Отсутствует необходимая информация");
        }

        if (team.requiredRoles.includes(sender.class)) {
          if (sender.region === team.region) {
            const { data: classData, error: classError } = await supabase
              .from("classes")
              .select("id")
              .eq("class_name", sender.class)
              .single();

            if (classError || !classData) {
              throw new Error("Нет информации о классе пользователя");
            }

            const { error: deleteError } = await supabase
              .from("class_to_team")
              .delete()
              .eq("team_id", teamId)
              .eq("class_id", classData.id);

            if (deleteError) {
              throw new Error("Не удалось обновить соревнование");
            }

            await addUserToTeam(senderId, teamId, sender.class);

            await NotificationService.createNotification(
              senderId,
              `Ваш запрос на вступление в команду: ${team.name}, был одобрен`,
              "instant",
              { teamId: teamId },
              `/dashboard?team=${teamId}`
            );

            toast.success("Пользователь добавлен в команду");
          } else {
            toast.error("Пользователь не подходит по региону");
            throw new Error("Пользователь не подходит по региону");
          }
        } else {
          toast.error("Пользователь не подходит по роли");
          throw new Error("Пользователь не подходит по роли");
        }
      } 
      else if (moderation.metadata["actionType"] === "competition_join") {
        const teamId = moderation.metadata["teamId"];
        const competitionId = moderation.metadata["competitionId"];
        
        const { error } = await supabase
          .from('team_to_competition')
          .insert({
            team_id: teamId,
            competition_id: competitionId,
            status: 'approved'
          });

        if (error) throw error;

        await NotificationService.createNotification(
          moderation.sender_id,
          `Ваша команда была одобрена для участия в соревновании`,
          "instant",
          { competitionId },
          `/competitions/${competitionId}`
        );

        toast.success("Команда добавлена к соревнованию");
      }
      else if (moderation.metadata["actionType"] === "regional_submission") {
        const competitionId = moderation.metadata["competitionId"];
        const teamIds = moderation.metadata["teamIds"];
        
        const { error } = await supabase
          .from('teams')
          .update({ status: 'pending_federal' })
          .in('id', teamIds);

        if (error) throw error;

        await NotificationService.createNotification(
          moderation.sender_id,
          `Ваш набор команд был одобрен региональным администратором и отправлен на федеральный уровень`,
          "instant",
          { competitionId },
          `/competitions/${competitionId}`
        );

        toast.success("Набор команд отправлен на федеральный уровень");
      }
      else if (moderation.metadata["actionType"] === "federal_approval") {
        const competitionId = moderation.metadata["competitionId"];
        const teamIds = moderation.metadata["teamIds"];
        
        const { error } = await supabase
          .from('teams')
          .update({ status: 'approved' })
          .in('id', teamIds);

        if (error) throw error;

        const teamCompetitionInserts = teamIds.map((teamId: string) => ({
          team_id: teamId,
          competition_id: competitionId,
          status: 'approved'
        }));

        const { error: insertError } = await supabase
          .from('team_to_competition')
          .insert(teamCompetitionInserts);

        if (insertError) throw insertError;

        await NotificationService.createNotification(
          moderation.sender_id,
          `Ваш набор команд был одобрен для участия в федеральном соревновании`,
          "instant",
          { competitionId },
          `/competitions/${competitionId}`
        );

        toast.success("Набор команд одобрен для соревнования");
      }

      await NotificationService.deleteNotification(moderation.id);
      setModerations((prev) => prev.filter((m) => m.id !== moderation.id));
    } catch (error) {
      console.error("Ошибка подтверждения:", error);
      toast.error("Произошла ошибка при подтверждении");
    }
  };

  const handleReject = async (moderation: Notification) => {
    try {
      if (
        moderation.metadata["actionType"] === "team_join" &&
        moderation.sender_id
      ) {
        const teamId = moderation.metadata["entityId"];
        const senderId = moderation.sender_id;

        const team = await getTeamByID(teamId);

        await NotificationService.createNotification(
          senderId,
          `Ваш запрос на вступление в команду: ${
            team?.name || ""
          } был отклонён`,
          "instant",
          { teamId: teamId },
          `/dashboard`
        );
      } 
      else if (moderation.metadata["actionType"] === "competition_join") {
        const teamId = moderation.metadata["teamId"];
        const competitionId = moderation.metadata["competitionId"];
        const senderId = moderation.sender_id;

        await NotificationService.createNotification(
          senderId,
          `Ваша заявка на участие в соревновании была отклонена региональным администратором`,
          "instant",
          { competitionId },
          `/competitions`
        );
      }
      else if (moderation.metadata["actionType"] === "regional_submission") {
        const competitionId = moderation.metadata["competitionId"];
        const senderId = moderation.sender_id;

        await NotificationService.createNotification(
          senderId,
          `Ваш набор команд для федерального соревнования был отклонен региональным администратором`,
          "instant",
          { competitionId },
          `/competitions`
        );
      }
      else if (moderation.metadata["actionType"] === "federal_approval") {
        const competitionId = moderation.metadata["competitionId"];
        const senderId = moderation.sender_id;

        await NotificationService.createNotification(
          senderId,
          `Ваш набор команд для федерального соревнования был отклонен`,
          "instant",
          { competitionId },
          `/competitions`
        );
      }

      await NotificationService.deleteNotification(moderation.id);
      setModerations((prev) => prev.filter((m) => m.id !== moderation.id));
    } catch (error) {
      console.error("Ошибка отклонения:", error);
      toast.error("Произошла ошибка при отклонении");
    }
  };

  const renderEntityLink = (
    entityType: string,
    entityId: string,
    name: string
  ) => {
    return (
      <Link
        href={`/${entityType}s/${entityId}`}
        className="text-primary hover:underline"
      >
        {name}
      </Link>
    );
  };

  return (
    <Card className="col-span-3 w-full">
      <CardHeader>
        <CardTitle>Запросы на модерацию</CardTitle>
        <CardDescription>
          Действия требующие вашего подтверждения
        </CardDescription>
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
            {moderations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет действий</p>
            ) : (
              moderations.map((moderation) => (
                <div
                  key={moderation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="mb-3">
                    <p className="text-sm">
                      {moderation.content.split(" ").map((word, i) => {
                        if (word.startsWith("@")) {
                          const entity = word.substring(1);
                          const entityParts = entity.split(":");
                          return (
                            <span key={i}>
                              {renderEntityLink(
                                entityParts[0],
                                entityParts[1],
                                entityParts[2].split("_").join(" ")
                              )}{" "}
                            </span>
                          );
                        }
                        return <span key={i}>{word} </span>;
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(moderation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(moderation)}
                    >
                      Отклонить
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(moderation)}>
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