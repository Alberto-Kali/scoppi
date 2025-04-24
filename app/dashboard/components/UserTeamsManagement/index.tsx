"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Team } from "../types";
import { CreateTeamDialog } from "../CreateTeamDialog";
import { EditTeamDialog } from "../EditTeamDialog";
import { toast } from "sonner";

export function UserTeamsManagement({ user }: { user: any }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchUserTeams();
  }, [user?.id]);

  const fetchUserTeams = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from("user_to_team")
      .select("team_id, role")
      .eq("user_id", user.id)
      .neq("role", "banned");

    if (error) {
      toast.error("Не удалось получить элементы");
      return;
    }

    const teamIds = data.map(item => item.team_id);
    if (teamIds.length === 0) {
      setTeams([]);
      return;
    }

    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds);

    if (teamsError) {
      toast.error("Не удалось получить детали команды");
      return;
    }

    setTeams(teamsData || []);
  };

  const handleCreateTeam = async (name: string, region: number) => {
    const { data, error } = await supabase
      .from("teams")
      .insert([{ name, region, status: "active" }])
      .select()
      .single();

    if (error) {
      toast.error("Не удалось создать команду");
      return;
    }

    // Add user as captain to the new team
    const { error: userTeamError } = await supabase
      .from("user_to_team")
      .insert([{ user_id: user.id, team_id: data.id, role: "captain" }]);

    if (userTeamError) {
      toast.error("Не удалось назначить капитана");
      return;
    }

    toast.success("Команда создана успешно");
    setIsCreateDialogOpen(false);
    fetchUserTeams();
  };

  const handleUpdateTeam = async (teamId: number, name: string, region: number) => {
    const { error } = await supabase
      .from("teams")
      .update({ name, region })
      .eq("id", teamId);

    if (error) {
      toast.error("Не удалось обновить команду");
      return;
    }

    toast.success("Команда обновлена");
    setIsEditDialogOpen(false);
    fetchUserTeams();
  };

  const handleDeleteTeam = async (teamId: number) => {
    // First remove all team members
    const { error: membersError } = await supabase
      .from("user_to_team")
      .delete()
      .eq("team_id", teamId);

    if (membersError) {
      toast.error("Не удалось удалить пользователей");
      return;
    }

    // Then delete the team
    const { error: teamError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (teamError) {
      toast.error("Не удалось удалить команду");
      return;
    }

    toast.success("Команда удалена");
    fetchUserTeams();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Мои команды</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Создать команду</Button>
      </div>

      <div className="grid gap-4">
        {teams.map(team => (
          <div key={team.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{team.name}</h3>
            <p>Status: {team.status}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedTeam(team);
                  setIsEditDialogOpen(true);
                }}
              >
                Редактировать
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteTeam(team.id)}
              >
                Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CreateTeamDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateTeam}
      />
      
      {selectedTeam && (
        <EditTeamDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          team={selectedTeam}
          onUpdate={handleUpdateTeam}
        />
      )}
    </div>
  );
}