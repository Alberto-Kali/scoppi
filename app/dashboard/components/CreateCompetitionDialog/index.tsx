"use client";
import { SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCompetition } from "@/lib/api/api";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface CreateCompetitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "regional" | "federal";
  onCreate?: (competition: any) => void;
}

export function CreateCompetitionDialog({ open, onOpenChange, type, onCreate }: CreateCompetitionDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [registrationStart, setRegistrationStart] = useState<Date | undefined>();
  const [registrationEnd, setRegistrationEnd] = useState<Date | undefined>();
  const [eventStart, setEventStart] = useState<Date | undefined>();
  const [eventEnd, setEventEnd] = useState<Date | undefined>();
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
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
        type,
        discipline,
        registrationStart: registrationStart.toISOString().split('T')[0],
        registrationEnd: registrationEnd.toISOString().split('T')[0],
        eventStart: eventStart.toISOString().split('T')[0],
        eventEnd: eventEnd.toISOString().split('T')[0],
        maxParticipants,
        maxTeamMembers: 5,
        description,
        status: "upcoming",
        regions: type === "regional" ? selectedRegions : []
      };

      const result = await addCompetition(competitionData);
      if (result) {
        toast.success("Competition created successfully");
        onCreate?.(result);
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to create competition");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDiscipline("");
    setRegistrationStart(undefined);
    setRegistrationEnd(undefined);
    setEventStart(undefined);
    setEventEnd(undefined);
    setMaxParticipants(0);
    setSelectedRegions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create {type === "regional" ? "Regional" : "Federal"} Competition</DialogTitle>
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
              onChange={(e: { target: { value: SetStateAction<string>; }; }) => setDescription(e.target.value)}
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
          
          {type === "regional" && (
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
              
              {selectedRegions.length > 0 && (
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
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Competition"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}