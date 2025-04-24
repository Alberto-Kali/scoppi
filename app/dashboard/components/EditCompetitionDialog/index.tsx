"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCompetition } from "@/lib/api/api";
import { toast } from "sonner";
import { Competition } from "../types";
import { supabase } from "@/lib/supabaseClient";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface EditCompetitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition;
  onUpdate?: (competition: Competition) => void;
}

export function EditCompetitionDialog({ open, onOpenChange, competition, onUpdate }: EditCompetitionDialogProps) {
  const [title, setTitle] = useState(competition.title);
  const [description, setDescription] = useState(competition.description || "");
  const [discipline, setDiscipline] = useState(competition.discipline);
  const [registrationStart, setRegistrationStart] = useState<Date | undefined>(
    competition.registrationStart ? new Date(competition.registrationStart) : undefined
  );
  const [registrationEnd, setRegistrationEnd] = useState<Date | undefined>(
    competition.registrationEnd ? new Date(competition.registrationEnd) : undefined
  );
  const [eventStart, setEventStart] = useState<Date | undefined>(
    competition.eventStart ? new Date(competition.eventStart) : undefined
  );
  const [eventEnd, setEventEnd] = useState<Date | undefined>(
    competition.eventEnd ? new Date(competition.eventEnd) : undefined
  );
  const [maxParticipants, setMaxParticipants] = useState(competition.maxParticipants || 0);
  const [status, setStatus] = useState(competition.status);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(competition.regions || []);
  const [allRegions, setAllRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching regions:", error);
      } else {
        setAllRegions(data || []);
      }
    };

    fetchRegions();
  }, []);

  const handleSubmit = async () => {
    if (!title || !discipline || !registrationStart || !registrationEnd || !eventStart || !eventEnd) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const competitionData = {
        title,
        discipline,
        registrationStart: registrationStart.toISOString().split('T')[0],
        registrationEnd: registrationEnd.toISOString().split('T')[0],
        eventStart: eventStart.toISOString().split('T')[0],
        eventEnd: eventEnd.toISOString().split('T')[0],
        maxParticipants,
        description,
        status,
        regions: competition.type === "regional" ? selectedRegions : []
      };

      const result = await updateCompetition(competition.id, competitionData);
      if (result) {
        toast.success("Competition updated successfully");
        onUpdate?.(result);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to update competition");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Competition</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discipline">Discipline *</Label>
              <Input
                id="discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registration Start *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {registrationStart ? format(registrationStart, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={registrationStart}
                    onSelect={setRegistrationStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Registration End *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {registrationEnd ? format(registrationEnd, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={registrationEnd}
                    onSelect={setRegistrationEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Start *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventStart ? format(eventStart, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventStart}
                    onSelect={setEventStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Event End *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventEnd ? format(eventEnd, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventEnd}
                    onSelect={setEventEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {competition.type === "regional" && (
              <div className="space-y-2">
                <Label>Regions</Label>
                <Select
                  onValueChange={(value) => {
                    if (!selectedRegions.includes(value)) {
                      setSelectedRegions([...selectedRegions, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRegions.map(region => (
                      <SelectItem key={region.id} value={region.name}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {competition.type === "regional" && selectedRegions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRegions.map(region => (
                <div key={region} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <span>{region}</span>
                  <button 
                    onClick={() => setSelectedRegions(selectedRegions.filter(r => r !== region))}
                    className="text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Competition"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}