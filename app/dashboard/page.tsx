"use client";

import { ProfileSetupPage } from "./components/ProfileSetup";
import { DashboardLoader } from "@/components/ui/loader";
import {
  fetchUserProfile,
  fetchUserTeams,
  getCompetitions,
} from "@/lib/api/api";
import { Competition, Team } from "./components/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSession } from "@/components/SessionProvider";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { SidebarX } from "@/components/ui/sidebarX";
import { DashboardHeader } from "./components/Header";
import { DashboardCards } from "./components/DashboardCards";
import { UpcomingCompetitions } from "./components/UpcomingCompetitions";
import { UserTeams } from "./components/UserTeams";
import { AllCompetitions } from "./components/AllCompetitions";
import { CompetitionDetails } from "./components/CompetitionDetails";
import { User } from "./components/types";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { InvitationsWidget } from "./components/InvitiationsWidget";
import { ModerationWidget } from "./components/ModerationWidget";
import { RegionalCompetitions } from "./components/RegionalCompetitions";
import { FederalCompetitions } from "./components/FederalCompetitions";
import { UserTeamsManagement } from "./components/UserTeamsManagement";
import { MonitoringDashboard } from "./components/MonitoringDashboard";
import { AwardsManagement } from "./components/AwardsManagement";
import { AwardsWidget } from "./components/AwardsWidget";
import { AdminManagement } from "./components/AdminManagement";
import { NotificationService, Notification } from "@/lib/api/api";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const { user: sessionUser } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const handleCreateCompetition = () => {
    toast.success("Соревнование создано успешно");
  };

  const handleJoinTeam = async (team: Team, user: User | null) => {
    if (!user) {
      return;
    }
    toast.info("Запрос на вступление отправлен капитану11");
    await NotificationService.createModerationRequest(
      team.captain.id,
      `@user:${user.id}:${user.name
        .split(" ")
        .join("_")} хочет вступить в вашу команду @team:${team.id}:${
        team.name
      }`,
      "team_join",
      team.id,
      "team",
      user.id
    );
  };

  const handleSubmitTeam = (teamId: string) => {
    toast.success("Заявка команды отправлена на модерацию");
  };

  const isOpend = (old_state: boolean) => {
    if (old_state == true) {
      return false;
    } else {
      return true;
    }
  };

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "open" && comp.type === "open") ||
      (filter === "regional" && comp.type === "regional") ||
      (filter === "federal" && comp.type === "federal");
    return matchesSearch && matchesFilter;
  });

  const dashboardProps = {
    isLoading,
    user,
    competitions: filteredCompetitions,
    selectedCompetition,
    searchTerm,
    filter,
    activeTab,
    isOpen,
    setIsOpen,
    setSelectedCompetition,
    setSearchTerm,
    setFilter,
    handleCreateCompetition,
    handleJoinTeam,
    handleSubmitTeam,
  };

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      if (!sessionUser?.id) {
        return;
      }

      try {
        setIsLoading(true);
        const userProfile = await fetchUserProfile(sessionUser.id);

        if (userProfile == null) {
          throw new Error("User profile not found");
        } else {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "test@test.com",
            name: userProfile.name || "User",
            region: userProfile.region || "Москва",
            class: userProfile.class || "down",
            role: userProfile.role || "user",
            age: userProfile.age || "14",
            teams: (await fetchUserTeams(sessionUser.id)) || [],
            competitions: userProfile.competitions || [],
          });
          setHasProfile(true);
          const competitionsData = await getCompetitions();
          setCompetitions(competitionsData || []);
        }
      } catch (error) {
        toast.info("Setup your profile first!");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sessionUser]);

  if (isLoading) {
    return <DashboardLoader></DashboardLoader>;
  }

  if (!hasProfile) {
    return (
      <ProtectedRoute>
        <Toaster position="top-right" richColors />
        <ProfileSetupPage></ProfileSetupPage>
      </ProtectedRoute>
    );
  } else {
    if (!user?.role) {
      return;
    }
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <SidebarX
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isOpend={isOpend}
            role={user?.role || "user"}
          />
          <SidebarInset>
            <div className="flex h-screen bg-background">
              <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                  activeTab={activeTab}
                  user={user}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  isOpend={isOpend}
                />
                <main className="flex-1 overflow-y-auto p-6">
                  <Toaster position="top-right" richColors />

                  {activeTab === "dashboard" && (
                    <div className="space-y-6">
                      <DashboardCards {...dashboardProps} />
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <UpcomingCompetitions {...dashboardProps} />
                        {user?.role === "user" && (
                          <div>
                            <UserTeams {...dashboardProps} />
                            <AwardsWidget userId={user.id} />
                            <InvitationsWidget {...dashboardProps} />
                          </div>
                        )}
                        <ModerationWidget {...dashboardProps} />
                      </div>
                    </div>
                  )}

                  {activeTab === "competitions" && (
                    <AllCompetitions {...dashboardProps} />
                  )}

                  {activeTab === "teams" && user?.role === "user" && (
                    <UserTeamsManagement {...dashboardProps} />
                  )}

                  {activeTab === "regional_competitions" &&
                    user?.role === "regional_admin" && (
                      <RegionalCompetitions
                        competitions={competitions}
                        user={user}
                      />
                    )}

                  {activeTab === "federal_competitions" &&
                    user?.role === "federation_admin" && (
                      <FederalCompetitions
                        competitions={competitions}
                        user={user}
                      />
                    )}

                  {activeTab === "monitoring" &&
                    user?.role === "federation_admin" && (
                      <MonitoringDashboard />
                    )}

                  {activeTab === "awards" &&
                    (user?.role === "regional_admin" ||
                      user?.role === "federation_admin") && (
                      <AwardsManagement user={user} />
                    )}

                  {selectedCompetition && (
                    <CompetitionDetails
                      competition={selectedCompetition}
                      onClose={() => setSelectedCompetition(null)}
                      user={user}
                      onJoinTeam={handleJoinTeam}
                      onSubmitTeam={handleSubmitTeam}
                    />
                  )}
                </main>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }
}
