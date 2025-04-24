"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Team } from "../types";
import { supabase } from "@/lib/supabaseClient";

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onUpdate: (teamId: number, name: string, region: number) => void;
}

export function EditTeamDialog({ open, onOpenChange, team, onUpdate }: EditTeamDialogProps) {
  const [name, setName] = useState(team.name);
  const [region, setRegion] = useState<number>(team.region);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available regions when dialog opens
  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to fetch regions");
      } else {
        setRegions(data || []);
      }
    };

    if (open) {
      fetchRegions();
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name || !region) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      onUpdate(team.id, name, region);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region">Region *</Label>
            <Select 
              value={region.toString()}
              onValueChange={(value) => setRegion(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}