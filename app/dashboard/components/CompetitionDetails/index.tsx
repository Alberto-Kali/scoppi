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
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { NotificationService } from "@/lib/api/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  role: string;
  region: number;
  class: string;
  avatar_url?: string;
  email?: string;
}

interface Team {
  id: number;
  name: string;
  status: string;
  region: number;
  maxMemders: number;
  captain?: User;
  members: User[];
  requiredClasses?: string[];
}

interface Competition {
  id: string;
  title: string;
  type: string;
  discipline: string;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  maxTeamMembers: number;
  status: string;
  description?: string;
  regionalAdminId?: string;
  federalAdminId?: string;
  teams: Team[];
}

interface CompetitionDetailsProps {
  competition: Competition;
  user: User | null;
  onClose: () => void;
  onJoinTeam: (team: Team, user: User | null) => void;
  onSubmitTeam: (teamId: number) => void;
}

export function CompetitionDetails({
  competition,
  onClose,
  user,
  onJoinTeam,
  onSubmitTeam,
}: CompetitionDetailsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [regionalTeams, setRegionalTeams] = useState<Team[]>([]);

  const checkValid = (user: User | null, team: Team | null) => {
    if (!user || !team || !team.requiredClasses?.includes(user.class) || !(team.region === user.region)) {
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

  const handleSubmitToRegional = async () => {
    if (!user) return;
    
    try {
      const { data: userTeams, error } = await supabase
        .from('team_to_competition')
        .select('team_id')
        .eq('competition_id', competition.id)
        .eq('status', 'approved')
        .in('team_id', 
          (await supabase
            .from('user_to_team')
            .select('team_id')
            .eq('user_id', user.id)
            .eq('role', 'captain')
          ).data?.map(t => t.team_id) || []
        );

      if (error) throw error;

      if (userTeams.length === 0) {
        toast.error("У вас нет команд для этого соревнования");
        return;
      }

      const teamIds = userTeams.map(team => team.team_id);

      await NotificationService.createNotification(
        competition.regionalAdminId || '',
        `Капитан @user:${user.id}_${user.name} хочет подать команды на региональное соревнование @competition:${competition.id}_${competition.title}`,
        "moderation",
        {
          actionType: "competition_join",
          competitionId: competition.id,
          teamIds,
          captainId: user.id
        },
        `/competitions/${competition.id}`
      );

      toast.success("Запрос отправлен региональному администратору");
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      toast.error("Произошла ошибка при отправке запроса");
    }
  };

  const handleOpenFederalSubmission = async () => {
    if (!user || user.role !== 'regional_admin') return;
    
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          user_to_team(*, profiles!user_to_team_user_id_fkey(*)),
          class_to_team(*, classes!class_to_team_class_id_fkey(*))
        `)
        .eq('region', user.region)
  
      if (error) throw error;
  
      if (!teams || teams.length === 0) {
        toast.error("В вашем регионе нет команд для этого соревнования");
        return;
      }
  
      const formattedTeams = teams.map(team => ({
        ...team,
        members: team.user_to_team.map((ut: { profiles: any; }) => ut.profiles),
        captain: team.user_to_team.find((ut: { role: string; }) => ut.role === 'captain')?.profiles,
        requiredClasses: team.class_to_team.map((ct: { classes: { class_name: any; }; }) => ct.classes.class_name)
      }));
  
      setRegionalTeams(formattedTeams);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Ошибка при загрузке команд:", error);
      toast.error("Произошла ошибка при загрузке команд");
    }
  };

  const handleSubmitToFederal = async () => {
    if (!user || selectedTeams.length === 0) return;
    
    try {
      // Получаем всех федеральных администраторов
      const { data: federalAdmins, error: adminsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'federation_admin');
  
      if (adminsError) throw adminsError;
  
      if (!federalAdmins || federalAdmins.length === 0) {
        toast.error("Не найдено федеральных администраторов");
        return;
      }
  
      // Отправляем уведомление каждому федеральному администратору
      const notificationPromises = federalAdmins.map(admin => 
        NotificationService.createNotification(
          admin.id,
          `Региональный администратор @user:${user.id}_${user.name} хочет подать набор команд на федеральное соревнование @competition:${competition.id}_${competition.title}`,
          "moderation",
          {
            actionType: "regional_submission",
            competitionId: competition.id,
            teamIds: selectedTeams,
            region: user.region
          },
          `/competitions/${competition.id}`
        )
      );
  
      // Ждем завершения всех отправок
      await Promise.all(notificationPromises);
  
      setIsDialogOpen(false);
      setSelectedTeams([]);
      toast.success(`Запрос отправлен ${federalAdmins.length} федеральным администраторам`);
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      toast.error("Произошла ошибка при отправке запроса");
    }
  };

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
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
            </div>

            <Separator />

            {user?.role === 'regional_admin' && competition.type === 'federal' && (
                  <>
                    <Button onClick={handleOpenFederalSubmission}>
                      Подать набор команд на федеральный этап
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Выбор команд для подачи</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {regionalTeams.map(team => (
                            <Card 
                              key={team.id} 
                              className={`cursor-pointer ${selectedTeams.includes(team.id) ? 'border-primary' : ''}`}
                              onClick={() => toggleTeamSelection(team.id)}
                            >
                              <CardHeader>
                                <CardTitle>{team.name}</CardTitle>
                                <CardDescription>
                                  Капитан: {team.captain?.name || 'Неизвестно'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {team.members.map(member => (
                                    <Avatar key={member.id} className="h-8 w-8">
                                      <AvatarImage src={member.avatar_url} />
                                      <AvatarFallback>
                                        {member.name?.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <DialogFooter>
                          <Button 
                            onClick={handleSubmitToFederal}
                            disabled={selectedTeams.length === 0}
                          >
                            Отправить выбранные команды ({selectedTeams.length})
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Separator />
                  </>
                )}

            

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Команды</h3>
                {competition.type === "open" && user?.role === "user" && (
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
                              Капитан: {team.captain?.name || "Неизвестно"}
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

                            {team.status === "forming" && team.requiredClasses && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Требуются
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {team.requiredClasses.map((className) => (
                                    <Badge key={className} variant="secondary">
                                      {className}
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
                            team.captain?.id !== user?.id &&
                            isValid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onJoinTeam(team, user)}
                              >
                                Вступить
                              </Button>
                            )}
                          {team.captain?.id === user?.id && (
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

            {(user?.role === 'captain' || user?.role === 'regional_admin') && (
              <div className="space-y-4">
                <Separator />
                <h3 className="font-semibold">Действия администратора</h3>
                
                {user?.role === 'captain' && competition.type === 'regional' && (
                  <Button 
                    onClick={handleSubmitToRegional}
                    disabled={competition.teams.some(t => t.captain?.id === user.id)}
                  >
                    Подать команду на соревнование
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}