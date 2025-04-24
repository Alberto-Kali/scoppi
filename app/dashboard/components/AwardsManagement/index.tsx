"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Competition, Team } from "../types";
import { AwardTeamsDialog } from "../AwardTeamsDialog";
import { toast } from "sonner";

export function AwardsManagement({ user }: { user: any }) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

  useEffect(() => {
    fetchRegionalCompetitions();
  }, [user?.region]);

  const fetchRegionalCompetitions = async () => {
    if (!user?.region) return;

    // First get competitions for the region
    const { data: regionCompetitions, error: regionError } = await supabase
      .from("regions_to_competitions")
      .select("competition_id")
      .eq("region_id", user.region);

    if (regionError) {
      toast.error("Failed to fetch regional competitions");
      return;
    }

    const competitionIds = regionCompetitions.map(rc => rc.competition_id);
    if (competitionIds.length === 0) {
      setCompetitions([]);
      return;
    }

    // Then get competition details
    const { data: competitionsData, error: compError } = await supabase
      .from("competitions")
      .select("*")
      .in("id", competitionIds)
      .eq("type", "regional");

    if (compError) {
      toast.error("Failed to fetch competition details");
      return;
    }

    setCompetitions(competitionsData || []);
  };

  const handleAwardTeams = async (competitionId: string, awards: { teamId: number; reward: any }[]) => {
    // Save rewards to reward_for_user table for each team member
    for (const award of awards) {
      const { data: teamMembers, error: membersError } = await supabase
        .from("user_to_team")
        .select("user_id")
        .eq("team_id", award.teamId);

      if (membersError) {
        toast.error(`Failed to get members for team ${award.teamId}`);
        continue;
      }

      for (const member of teamMembers) {
        const { error } = await supabase
          .from("reward_for_user")
          .insert([{
            user: member.user_id,
            reward: award.reward,
            competition_id: competitionId
          }]);

        if (error) {
          toast.error(`Failed to award user ${member.user_id}`);
        }
      }
    }

    toast.success("Awards distributed successfully");
    setIsAwardDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Awards Management</h2>
      
      <div className="grid gap-4">
        {competitions.map(comp => (
          <div key={comp.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{comp.title}</h3>
            <p>{comp.description}</p>
            <Button 
              className="mt-2"
              onClick={() => {
                setSelectedCompetition(comp);
                setIsAwardDialogOpen(true);
              }}
            >
              Distribute Awards
            </Button>
          </div>
        ))}
      </div>

      {selectedCompetition && (
        <AwardTeamsDialog
          open={isAwardDialogOpen}
          onOpenChange={setIsAwardDialogOpen}
          competition={selectedCompetition}
          onAward={handleAwardTeams}
        />
      )}
    </div>
  );
}