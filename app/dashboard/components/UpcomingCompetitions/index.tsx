import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardProps } from "../types";

export function UpcomingCompetitions({
  isLoading,
  competitions,
  setSelectedCompetition,
}: DashboardProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Предстоящие соревнования</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div>
            <div className="sm:hidden">
              {competitions.slice(0, 3).map((comp) => (
                <div key={comp.id} className="mb-4 p-4 border rounded-lg">
                  <div className="font-medium">{comp.title}</div>
                  <div>
                    <Badge variant="outline">
                      {comp.type === "open" && "Открытое"}
                      {comp.type === "regional" && "Региональное"}
                      {comp.type === "federal" && "Федеральное"}
                    </Badge>
                  </div>
                  <div>{comp.discipline}</div>
                  <div>{new Date(comp.eventStart).toLocaleDateString()}</div>
                  <div>
                    <Badge>
                      {comp.status === "upcoming" && "Предстоящее"}
                      {comp.status === "ongoing" && "Активное"}
                      {comp.status === "completed" && "Завершено"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Дисциплина</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitions.slice(0, 3).map((comp) => (
                    <TableRow
                      key={comp.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCompetition(comp)}
                    >
                      <TableCell className="font-medium">
                        {comp.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {comp.type === "open" && "Открытое"}
                          {comp.type === "regional" && "Региональное"}
                          {comp.type === "federal" && "Федеральное"}
                        </Badge>
                      </TableCell>
                      <TableCell>{comp.discipline}</TableCell>
                      <TableCell>
                        {new Date(comp.eventStart).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {comp.status === "upcoming" && "Предстоящее"}
                          {comp.status === "ongoing" && "Активное"}
                          {comp.status === "completed" && "Завершено"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
