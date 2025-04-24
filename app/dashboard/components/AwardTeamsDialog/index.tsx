"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Competition, Team } from "../types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface AwardTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition;
  onAward: (competitionId: string, awards: { teamId: number; reward: any }[]) => void;
}

export function AwardTeamsDialog({ open, onOpenChange, competition, onAward }: AwardTeamsDialogProps) {
  const [awards, setAwards] = useState<{ teamId: number; reward: any }[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && competition) {
      fetchCompetitionTeams();
    }
  }, [open, competition]);

  const fetchCompetitionTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("team_to_competition")
        .select("team_id, teams(*)")
        .eq("competition_id", competition.id);

      if (error) throw error;

      const teams = data?.map(item => item.teams).filter(Boolean) as Team[];
      setAvailableTeams(teams || []);
    } catch (error) {
      toast.error("Failed to fetch competition teams");
    }
  };

  const handleAddAward = () => {
    setAwards([...awards, { teamId: 0, reward: { type: "", value: "" } }]);
  };

  const handleTeamChange = (index: number, teamId: number) => {
    const newAwards = [...awards];
    newAwards[index].teamId = teamId;
    setAwards(newAwards);
  };

  const handleRewardTypeChange = (index: number, type: string) => {
    const newAwards = [...awards];
    newAwards[index].reward.type = type;
    setAwards(newAwards);
  };

  const handleRewardValueChange = (index: number, value: string) => {
    const newAwards = [...awards];
    newAwards[index].reward.value = value;
    setAwards(newAwards);
  };

  const handleRemoveAward = (index: number) => {
    const newAwards = [...awards];
    newAwards.splice(index, 1);
    setAwards(newAwards);
  };

  const handleSubmit = async () => {
    // Validate all awards have team and reward type
    if (awards.some(award => !award.teamId || !award.reward.type)) {
      toast.error("Please fill all required fields for each award");
      return;
    }

    setIsLoading(true);
    try {
      await onAward(competition.id, awards);
      setAwards([]);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to distribute awards");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Award Teams for {competition.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {awards.length === 0 && (
            <div className="text-center py-4">
              <p>No awards added yet</p>
            </div>
          )}
          
          {awards.map((award, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Award #{index + 1}</h4>
                <button 
                  onClick={() => handleRemoveAward(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
              
              <div className="space-y-2">
                <Label>Team *</Label>
                <Select
                  value={award.teamId.toString()}
                  onValueChange={(value) => handleTeamChange(index, Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Reward Type *</Label>
                <Select
                  value={award.reward.type}
                  onValueChange={(value) => handleRewardTypeChange(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reward type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="medal">Medal</SelectItem>
                    <SelectItem value="prize">Prize</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Reward Details</Label>
                <Input
                  placeholder="e.g., Gold Medal, $100, etc."
                  value={award.reward.value}
                  onChange={(e) => handleRewardValueChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            onClick={handleAddAward}
            className="w-full"
          >
            Add Award
          </Button>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || awards.length === 0}>
            {isLoading ? "Distributing..." : "Distribute Awards"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}