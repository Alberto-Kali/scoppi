import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DashboardProps } from "../types";

export function UserTeams({
  isLoading,
  competitions,
  user,
  handleSubmitTeam,
}: DashboardProps) {
  const userTeams = competitions.flatMap((comp) => {
    const cpt = comp.teams.filter(
      (team) =>
        team.captain.id === user?.id ||
        team.members.some((member) => member.id === user?.id)
    );
    return cpt;
  });

  return (
    <Card className="col-span-3 w-full">
      <CardHeader>
        <CardTitle>Ваши активные команды</CardTitle>
        <CardDescription>
          Команды, в которых вы участвуете или являетесь капитаном
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
            {userTeams.map((team) => {
              const competition = competitions.find((c) =>
                c.teams.some((t) => t.id === team.id)
              );

              return (
                <ContextMenu key={team.id}>
                  <ContextMenuTrigger>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {competition?.title}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {team.status === "forming" && "Формируется"}
                        {team.status === "pending" && "На модерации"}
                        {team.status === "approved" && "Подтверждена"}
                        {team.status === "rejected" && "Отклонена"}
                      </Badge>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleSubmitTeam(team.id)}>
                      Отправить на модерацию
                    </ContextMenuItem>
                    <ContextMenuItem>Редактировать</ContextMenuItem>
                    <ContextMenuItem className="text-red-600">
                      Удалить
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
