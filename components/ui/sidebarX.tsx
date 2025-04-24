"use client";

import { LogoutButton } from "@/components/ui/logoutbutton";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Trophy, Users, User, Settings, Monitor, Award, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarProps {
  isOpen: boolean;
  isOpend(value: boolean): boolean;
  setIsOpen(value: boolean): void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string; // Add role prop
}

export function SidebarX({ activeTab, setActiveTab, isOpen, isOpend, setIsOpen, role }: SidebarProps) {
  // Base tabs for all users
  const baseTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Главная' },
    { id: 'competitions', icon: Trophy, label: 'Соревнования' },
    { id: 'profile', icon: User, label: 'Профиль' },
  ];

  // Role-specific tabs
  const roleTabs = {
    user: [
      { id: 'teams', icon: Users, label: 'Команды' },
    ],
    regional_admin: [
      { id: 'regional_competitions', icon: Trophy, label: 'Региональные мероприятия' },
      //{ id: 'awards', icon: Award, label: 'Награды' },
    ],
    federation_admin: [
      { id: 'federal_competitions', icon: Trophy, label: 'Федеральные мероприятия' },
      { id: 'monitoring', icon: Monitor, label: 'Мониторинг' },
      //{ id: 'awards', icon: Award, label: 'Награды' },
    ],
  };

  // Combine tabs based on role
  const tabs = [
    ...baseTabs,
    ...(roleTabs[role as keyof typeof roleTabs] || []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <SidebarTrigger className="sm:hidden"/>
      </SidebarHeader>
      
      <SidebarContent>
        <nav className="grid items-start px-2 text-sm font-medium lg:px-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-4",
                activeTab === tab.id && "bg-muted",
                !isOpen && "justify-center"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {isOpen && <span>{tab.label}</span>}
            </Button>
          ))}
        </nav>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className={cn("w-full justify-start gap-3", !isOpen && "justify-center")}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4" />
          {isOpen && <span>Настройки</span>}
        </Button>
        <LogoutButton isOpen={isOpen} isOpend={isOpend} setIsOpen={setIsOpen} />
      </SidebarFooter>
    </Sidebar>
  );
}