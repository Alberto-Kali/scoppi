"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Competition } from "../types";
import { CreateCompetitionDialog } from "../CreateCompetitionDialog";
import { EditCompetitionDialog } from "../EditCompetitionDialog";
import { AwardTeamsDialog } from "../AwardTeamsDialog";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, Award, MoreHorizontal } from "lucide-react";
import { DeleteCompetitionDialog } from "../DeleteCompetitionDialog";

export function RegionalCompetitions({ competitions, user }: { competitions: Competition[], user: any }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

  const regionalCompetitions = competitions.filter(c => c.type === 'regional');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Региональные мероприятия</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Создать мероприятие</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Дата начала</TableHead>
            <TableHead>Дата окончания</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regionalCompetitions.map(comp => (
            <TableRow key={comp.id} onContextMenu={(e) => {
              e.preventDefault();
              setSelectedCompetition(comp);
            }}>
              <TableCell className="font-medium">{comp.title}</TableCell>
              <TableCell>{comp.description}</TableCell>
              <TableCell>{new Date(comp.eventStart).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(comp.eventEnd).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedCompetition(comp);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedCompetition(comp);
                      setIsAwardDialogOpen(true);
                    }}>
                      <Award className="mr-2 h-4 w-4" />
                      Подвести итоги
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => {
                        setSelectedCompetition(comp);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateCompetitionDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        type="regional"
      />
      
      {selectedCompetition && (
        <>
          <EditCompetitionDialog 
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen}
            competition={selectedCompetition}
          />
          <AwardTeamsDialog
            open={isAwardDialogOpen}
            onOpenChange={setIsAwardDialogOpen}
            competition={selectedCompetition}
          />
          <DeleteCompetitionDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            competition={selectedCompetition}
          />
        </>
      )}
    </div>
  );
}