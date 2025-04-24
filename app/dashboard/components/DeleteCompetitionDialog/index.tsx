"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Competition } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DeleteCompetitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition | null;
  onSuccess?: () => void;
}

export function DeleteCompetitionDialog({
  open,
  onOpenChange,
  competition,
  onSuccess,
}: DeleteCompetitionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!competition) return;

    setIsLoading(true);
    try {
      // Удаляем связанные записи в regions_to_competitions
      const { error: regionsError } = await supabase
        .from("regions_to_competitions")
        .delete()
        .eq("competition_id", competition.id);

      if (regionsError) throw regionsError;

      // Удаляем связанные записи в team_to_competition
      const { error: teamsError } = await supabase
        .from("team_to_competition")
        .delete()
        .eq("competition_id", competition.id);

      if (teamsError) throw teamsError;

      // Удаляем само мероприятие
      const { error: competitionError } = await supabase
        .from("competitions")
        .delete()
        .eq("id", competition.id);

      if (competitionError) throw competitionError;

      toast.success(`Мероприятие "${competition.title}" успешно удалено.`);

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting competition:", error);
      toast.error("Не удалось удалить мероприятие. Пожалуйста, попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить мероприятие</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить мероприятие "{competition?.title}"?
            Это действие нельзя отменить. Все связанные данные (регионы, команды) также будут удалены.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Удаление..." : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}