import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "../types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { InstantNotifications } from "../InstantNotifications";

interface HeaderProps {
  isOpen: boolean;
  isOpend(value: boolean): boolean;
  setIsOpen(value: boolean): void;
  activeTab: string;
  user: User | null;
}

export function DashboardHeader({
  activeTab,
  user,
  setIsOpen,
  isOpend,
  isOpen,
}: HeaderProps) {
  return (
    <header className="bg-background border-b flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <div className="sm:hidden">
          <SidebarTrigger className="ml-auto" />
        </div>
        <div className="hidden sm:block">
          <SidebarTrigger
            className="ml-auto"
            onClick={() => setIsOpen(isOpend(isOpen))}
          />
        </div>
        <h1 className="text-xl font-semibold">
          {activeTab === "dashboard" && "Главная"}
          {activeTab === "competitions" && "Соревнования"}
          {activeTab === "teams" && "Команды"}
          {activeTab === "profile" && "Профиль"}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <InstantNotifications user={user}></InstantNotifications>
        <ThemeToggle />
        <Avatar>
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback>
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
