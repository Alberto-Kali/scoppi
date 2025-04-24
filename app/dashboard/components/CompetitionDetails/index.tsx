import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Competition, User, Team } from "../types";
import { Plus } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { use } from "react";

interface CompetitionDetailsProps {
  competition: Competition;
  user: User | null;
  onClose: () => void;
  onJoinTeam: (team: Team, user: User | null) => void;
  onSubmitTeam: (teamId: string) => void;
}

export function CompetitionDetails({
  competition,
  onClose,
  user,
  onJoinTeam,
  onSubmitTeam,
}: CompetitionDetailsProps) {
  const checkValid = (user: User | null, team: Team | null) => {
    if (!user || !team || !team.requiredRoles?.includes(user.class) || !(team.region == user.region)) {
      return false;
    }
    return true;
  };

  const checkCommandJoin = (user: User | null, team: Team | null) => {
    if (!user || !team || !team.members?.some(member => member.id === user.id)) {
      return false;
    }
    return true;
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] opacity-100">
        <div className="mx-auto w-full max-w-4xl overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>{competition.title}</DrawerTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {competition.type === "open" && "Открытое"}
                {competition.type === "regional" && "Региональное"}
                {competition.type === "federal" && "Федеральное"}
              </Badge>
              <Badge>
                {competition.status === "upcoming" && "Предстоящее"}
                {competition.status === "ongoing" && "Активное"}
                {competition.status === "completed" && "Завершено"}
              </Badge>
            </div>
          </DrawerHeader>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-muted-foreground">{competition.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Дисциплина</h3>
                <p className="text-muted-foreground">
                  {competition.discipline}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Даты проведения</h3>
                <p className="text-muted-foreground">
                  {new Date(competition.eventStart).toLocaleDateString()} -{" "}
                  {new Date(competition.eventEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Регистрация</h3>
                <p className="text-muted-foreground">
                  {new Date(competition.registrationStart).toLocaleDateString()}{" "}
                  - {new Date(competition.registrationEnd).toLocaleDateString()}
                </p>
              </div>

              {competition.regions && (
                <div>
                  <h3 className="font-semibold mb-2">Регионы</h3>
                  <p className="text-muted-foreground">
                    {competition.regions.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Команды</h3>
                {competition.type === "open" && (
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Создать команду
                  </Button>
                )}
              </div>

              {competition.teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Пока нет зарегистрированных команд
                </div>
              ) : (
                <div className="space-y-4">
                  {competition.teams.map((team) => {
                    const isMember = checkCommandJoin(user, team);
                    const isValid = checkValid(user, team);
                    
                    return (
                      <Card key={team.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            {isMember ? (
                              <CardTitle>{team.name}: +</CardTitle>
                            ) : (
                              <CardTitle>{team.name}</CardTitle>
                            )}
                            <CardDescription>
                              Капитан: {team.captain.name}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {team.status === "forming" && "Формируется"}
                            {team.status === "pending" && "На модерации"}
                            {team.status === "approved" && "Подтверждена"}
                            {team.status === "rejected" && "Отклонена"}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-1">
                                Участники ({team.members.length}/
                                {competition.maxTeamMembers})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {team.members.length > 0 ? (
                                  team.members.map((member) => (
                                    <HoverCard key={member.id}>
                                      <HoverCardTrigger>
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={member.avatar_url} />
                                          <AvatarFallback>
                                            {member.name
                                              ?.split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                      </HoverCardTrigger>
                                      <HoverCardContent className="w-80">
                                        <div className="flex items-center space-x-4">
                                          <Avatar>
                                            <AvatarImage
                                              src={member.avatar_url}
                                            />
                                            <AvatarFallback>
                                              {member.name
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className="font-semibold">
                                              {member.name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              {member.email}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {member.region}
                                            </p>
                                          </div>
                                        </div>
                                      </HoverCardContent>
                                    </HoverCard>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Пока нет участников
                                  </span>
                                )}
                              </div>
                            </div>

                            {team.status === "forming" && team.requiredRoles && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Требуются
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {team.requiredRoles.map((role) => (
                                    <Badge key={role} variant="secondary">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Progress
                              value={
                                (team.members.length /
                                  competition.maxTeamMembers) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                          {team.status === "forming" &&
                            team.captain.id !== user?.id &&
                            isValid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onJoinTeam(team, user)}
                              >
                                Вступить
                              </Button>
                            )}
                          {team.captain.id === user?.id && (
                            <>
                              {team.status === "forming" && (
                                <Button
                                  size="sm"
                                  onClick={() => onSubmitTeam(team.id)}
                                >
                                  Отправить на модерацию
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                Редактировать
                              </Button>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}