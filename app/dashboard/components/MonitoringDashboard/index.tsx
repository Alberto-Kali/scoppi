"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Competition, Team, User } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditTeamDialog } from "../EditTeamDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EditCompetitionDialog } from "../EditCompetitionDialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const handleTeamUpdate = async (
  teamId: number,
  name: string,
  region: number
) => {
  try {
    const { error } = await supabase
      .from("teams")
      .update({ name, region })
      .eq("id", teamId);

    if (error) throw error;

    toast.success("Команда успешно обновлена");
    // Update local state
    setTeams(
      teams.map((team) =>
        team.id === teamId ? { ...team, name, region } : team
      )
    );
  } catch (error) {
    toast.error("Ошибка при обновлении команды");
    console.error(error);
  }
};

function TeamTableRow({
  team,
  onUpdate,
}: {
  team: Team;
  onUpdate: (teamId: number, name: string, region: number) => void;
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{team.name}</TableCell>
        <TableCell>
          <Badge variant="outline">{team.status}</Badge>
        </TableCell>
        <TableCell>{team.region}</TableCell>
        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            Редактировать
          </Button>
        </TableCell>
      </TableRow>

      <EditTeamDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        team={team}
        onUpdate={onUpdate}
      />
    </>
  );
}

const handleCompetitionUpdate = async (competition: Competition) => {
  try {
    const { error } = await supabase
      .from("competitions")
      .update(competition)
      .eq("id", competition.id);

    if (error) throw error;

    toast.success("Соревнование успешно обновлено");
    // Update local state
    setCompetitions(
      competitions.map((comp) =>
        comp.id === competition.id ? competition : comp
      )
    );
  } catch (error) {
    toast.error("Ошибка при обновлении соревнования");
    console.error(error);
  }
};

function CompetitionTableRow({
  competition,
  onUpdate,
}: {
  competition: Competition;
  onUpdate: (competition: Competition) => void;
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{competition.title}</TableCell>
        <TableCell>
          <Badge variant="outline">{competition.status}</Badge>
        </TableCell>
        <TableCell>{competition.type}</TableCell>
        <TableCell>
          {competition.eventStart &&
            new Date(competition.eventStart).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            Редактировать
          </Button>
        </TableCell>
      </TableRow>

      <EditCompetitionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        competition={competition}
        onUpdate={onUpdate}
      />
    </>
  );
}

export function MonitoringDashboard() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("competitions");
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch competitions
      const { data: compData, error: compError } = await supabase
        .from("competitions")
        .select("*");

      if (compError) throw compError;
      setCompetitions(compData || []);

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*");

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      toast.error("Failed to fetch monitoring data");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error(`Failed to update user role: ${error.message}`);
      return false;
    }

    toast.success("User role updated successfully");
    // Update local state
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    return true;
  };

  if (isLoading) {
    return <div>Загрузка информации...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Панель мониторинга</h2>

      {isMobile ? (
        <div className="space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="competitions">Соревнования</SelectItem>
              <SelectItem value="teams">Команды</SelectItem>
              <SelectItem value="users">Пользователи</SelectItem>
              <SelectItem value="awards">Награды</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "competitions" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Card className="col-span-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitions.map((competition) => (
                        <CompetitionTableRow
                          key={competition.id}
                          competition={competition}
                          onUpdate={handleCompetitionUpdate}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "teams" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Card className="col-span-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role === "user" && "Пользователь"}
                              {user.role === "regional_admin" &&
                                "Региональный админ"}
                              {user.role === "federation_admin" &&
                                "Федеральный админ"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                updateUserRole(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Роль" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  Пользователь
                                </SelectItem>
                                <SelectItem value="regional_admin">
                                  Региональный админ
                                </SelectItem>
                                <SelectItem value="federation_admin">
                                  Федеральный админ
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Card className="col-span-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role === "user" && "Пользователь"}
                              {user.role === "regional_admin" &&
                                "Региональный админ"}
                              {user.role === "federation_admin" &&
                                "Федеральный админ"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                updateUserRole(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Роль" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  Пользователь
                                </SelectItem>
                                <SelectItem value="regional_admin">
                                  Региональный админ
                                </SelectItem>
                                <SelectItem value="federation_admin">
                                  Федеральный админ
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "awards" && (
            <div className="grid gap-4">
              <p>Award distribution monitoring coming soon</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue="competitions" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="competitions">Соревнования</TabsTrigger>
            <TabsTrigger value="teams">Команды</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="awards">Награды</TabsTrigger>
          </TabsList>

          <TabsContent value="competitions">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Card className="col-span-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitions.map((competition) => (
                        <CompetitionTableRow
                          key={competition.id}
                          competition={competition}
                          onUpdate={handleCompetitionUpdate}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <Card className="grid gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название команды</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Регион</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TeamTableRow
                      key={team.id}
                      team={team}
                      onUpdate={handleTeamUpdate}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Card className="col-span-4">
                  <Table className="bg-color-black">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Смена роли</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role === "user" && "Пользователь"}
                              {user.role === "regional_admin" &&
                                "Региональный админ"}
                              {user.role === "federation_admin" &&
                                "Федеральный админ"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                updateUserRole(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Выберите роль" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  Пользователь
                                </SelectItem>
                                <SelectItem value="regional_admin">
                                  Региональный админ
                                </SelectItem>
                                <SelectItem value="federation_admin">
                                  Федеральный админ
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="awards">
            <div className="grid gap-4">
              <p>Award distribution monitoring coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
