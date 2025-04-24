import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Competition, User } from "../types";

interface CompetitionCardProps {
  competition: Competition;
  user: User | null;
  onClick: () => void;
}

export function CompetitionCard({ user, competition, onClick }: CompetitionCardProps) {
  if (!user) {
    return;
  }
  return (
    <Card 
      className="cursor-pointer hover:border-primary"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>{competition.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {competition.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            {competition.type === 'open' && 'Открытое'}
            {competition.type === 'regional' && 'Региональное'}
            {competition.type === 'federal' && 'Федеральное'}
          </Badge>
          <Badge>
            {competition.status === 'upcoming' && 'Предстоящее'}
            {competition.status === 'ongoing' && 'Активное'}
            {competition.status === 'completed' && 'Завершено'}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Дисциплина:</span>
            <span className="text-sm font-medium">{competition.discipline}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Дата:</span>
            <span className="text-sm font-medium">
              {new Date(competition.eventStart).toLocaleDateString()} -{' '}
              {new Date(competition.eventEnd).toLocaleDateString()}
            </span>
          </div>
          {competition.regions.length !== 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Регион:</span>
                <span className="text-sm font-medium">{competition.regions[0] + " ..."}</span>
            </div>
          )}
          {competition.regions.length === 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Регион:</span>
                <span className="text-sm font-medium">{competition.regions}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          Подробнее
        </Button>
        {competition.type === 'open'  && competition.regions.includes(user.region) && (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Участвовать
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}