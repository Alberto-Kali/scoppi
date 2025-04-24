export type Competition = {
    id: string;
    title: string;
    type: 'open'| 'regional' | 'federal';
    discipline: string;
    registrationStart: string;
    registrationEnd: string;
    eventStart: string;
    eventEnd: string;
    regions: string[];
    maxParticipants: number;
    maxTeamMembers: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    description: string;
    teams: Team[];
    regionalAdminId?: string;
    federalAdminId?: string;
    isFederal?: boolean;
  };
  
  export type Team = {
    id: number;
    name: string;
    captain: User;
    members: User[];
    region: number;
    maxTeamMembers: number;
    status: string;//'forming' | 'pending' | 'approved' | 'rejected';
    requiredRoles?: string[];
  };
  
  // types/database.ts
  export type User = {
    id: string;
    email: string;
    name: string;
    age: string;
    region: number;
    class: string;
    role: 'banned' | 'on_moderation' | 'user' | 'regional_admin' | 'federation_admin';
    competitions?: Competition[];
    teams: Team[] | null;
    avatar_url?: string;
  };
  
  export type DashboardProps = {
    isLoading: boolean;
    user: User | null;
    competitions: Competition[];
    selectedCompetition: Competition | null;
    searchTerm: string;
    filter: string;
    activeTab: string;
    setSelectedCompetition: (comp: Competition | null) => void;
    setSearchTerm: (term: string) => void;
    setFilter: (filter: string) => void;
    handleCreateCompetition: () => void;
    handleJoinTeam: (team: Team, user: User | null) => void;
    handleSubmitTeam: (teamId: string) => void;
  };



  