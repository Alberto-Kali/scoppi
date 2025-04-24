"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, region: number) => void;
}

export function CreateTeamDialog({ open, onOpenChange, onCreate }: CreateTeamDialogProps) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState<number | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useState(() => {
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
      onCreate(name, region);
      setName("");
      setRegion(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
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
              value={region?.toString() || ""}
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
            {isLoading ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}