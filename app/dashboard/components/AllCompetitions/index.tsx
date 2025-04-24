import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Download } from "lucide-react";
import { DashboardProps } from "../types";
import { CompetitionCard } from "../CompetitionCard";

export function AllCompetitions({
  user,
  isLoading,
  competitions,
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  setSelectedCompetition,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Все соревнования</h2>
        <div className="flex space-x-2">
          <div className="sm:hidden"></div>
          <div className="hidden sm:block">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Фильтры
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  Все
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("open")}>
                  Открытые
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("regional")}>
                  Региональные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("federal")}>
                  Федеральные
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Input
            placeholder="Поиск соревнований..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitions.map((comp) => (
            <CompetitionCard
              user={user}
              key={comp.id}
              competition={comp}
              onClick={() => setSelectedCompetition(comp)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
