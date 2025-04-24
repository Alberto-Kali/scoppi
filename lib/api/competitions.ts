import { supabase } from "@/lib/supabaseClient";
import { Team, Competition } from '@/app/dashboard/components/types';

export const fetchCompetitions = async (competitionId: string): Promise<Competition[] | null> => {
  try {
    // 1. Get the competition data
    const { data: competition, error: competitionError } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single();

    if (competitionError) throw competitionError;
    if (!competition) return null;

    // 2. Get all team IDs for this competition
    const { data: teamCompetitions, error: teamCompError } = await supabase
      .from('team_to_competition')
      .select('team_id')
      .eq('competition_id', competitionId);

    if (teamCompError) throw teamCompError;
    if (!teamCompetitions?.length) return [{ ...competition, teams: [] }];

    // 3. Get full team data for each team
    const teamIds = teamCompetitions.map(tc => tc.team_id);
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (teamsError) throw teamsError;
    if (!teams?.length) return [{ ...competition, teams: [] }];

    // 4. Get all team members for each team
    const { data: allTeamMemberships, error: membersError } = await supabase
      .from('user_to_team')
      .select('user_id, team_id, role')
      .in('team_id', teamIds)
      .neq('role', 'banned');

    if (membersError) throw membersError;

    // 5. Get user data for all team members
    const memberUserIds = allTeamMemberships?.map(m => m.user_id) || [];
    const { data: memberUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', memberUserIds);

    if (usersError) throw usersError;

    // 6. Get required classes for each team
    const { data: teamClasses, error: classesError } = await supabase
      .from('class_to_team')
      .select('team_id, classes(id, class_name)')
      .in('team_id', teamIds);

    if (classesError) throw classesError;

    // 7. Construct the Team objects for each team
    const fullTeams: Team[] = teams.map(team => {
      const teamMemberships = allTeamMemberships?.filter(m => m.team_id === team.id) || [];
      
      // Find captain
      const captainMembership = teamMemberships.find(m => m.role === 'captain');
      const captain = captainMembership && memberUsers?.find(u => u.id === captainMembership.user_id);
      
      if (!captain) {
        console.warn(`No captain found for team ${team.id}`);
      }

      // Find members
      const memberIds = teamMemberships
        .filter(m => m.role !== 'captain')
        .map(m => m.user_id);
      const members = memberUsers?.filter(u => memberIds.includes(u.id)) || [];

      // Find required classes with proper type handling
      const requiredClasses = (teamClasses || [])
        .filter((tc: any) => tc.team_id === team.id && tc.classes)
        .map((tc: any) => tc.classes.class_name)
        .filter((className: string | undefined) => className !== undefined) as string[];

      return {
        id: team.id,
        name: team.name,
        captain: captain!,
        members,
        status: team.status,
        requiredRoles: requiredClasses.length ? requiredClasses : undefined
      };
    });

    // 8. Return the competition with its teams
    return [{
      ...competition,
      teams: fullTeams
    }];

  } catch (error) {
    console.error('Error fetching competition teams:', error);
    return null;
  }
};


export const fetchAllCompetitions = async (): Promise<Competition[] | null> => {
  try {
    // 1. Get all competitions data
    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('*');

    if (competitionsError) throw competitionsError;
    if (!competitions?.length) return [];

    // 2. Get all team-to-competition mappings in one query
    const competitionIds = competitions.map(c => c.id);
    const { data: allTeamCompetitions, error: teamCompError } = await supabase
      .from('team_to_competition')
      .select('competition_id, team_id')
      .in('competition_id', competitionIds);

    if (teamCompError) throw teamCompError;

    // 3. Get all unique team IDs
    const teamIds = [...new Set(allTeamCompetitions?.map(tc => tc.team_id) || [])];
    
    // Early return if no teams found
    if (teamIds.length === 0) {
      return competitions.map(competition => ({
        ...competition,
        teams: []
      }));
    }

    // 4. Get full team data for all teams in one query
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (teamsError) throw teamsError;

    // 5. Get all team memberships in one query
    const { data: allTeamMemberships, error: membersError } = await supabase
      .from('user_to_team')
      .select('user_id, team_id, role')
      .in('team_id', teamIds)
      .neq('role', 'banned');

    if (membersError) throw membersError;

    // 6. Get all user data for members in one query
    const memberUserIds = [...new Set(allTeamMemberships?.map(m => m.user_id) || [])];
    const { data: memberUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', memberUserIds);

    if (usersError) throw usersError;

    // 7. Get all required classes for teams in one query
    const { data: teamClasses, error: classesError } = await supabase
      .from('class_to_team')
      .select('team_id, classes(id, class_name)')
      .in('team_id', teamIds);

    if (classesError) throw classesError;

    // 8. Create a map of team_id to Team object for efficient lookup
    const teamsMap = new Map<string, Team>();
    
    (teams || []).forEach(team => {
      const teamMemberships = allTeamMemberships?.filter(m => m.team_id === team.id) || [];
      
      // Find captain
      const captainMembership = teamMemberships.find(m => m.role === 'captain');
      const captain = captainMembership && memberUsers?.find(u => u.id === captainMembership.user_id);
      
      if (!captain) {
        console.warn(`No captain found for team ${team.id}`);
      }

      // Find members
      const memberIds = teamMemberships
        .filter(m => m.role !== 'captain')
        .map(m => m.user_id);
      const members = memberUsers?.filter(u => memberIds.includes(u.id)) || [];

      // Get required classes
      const requiredClasses = (teamClasses || [])
        .filter((tc: any) => tc.team_id === team.id && tc.classes)
        .map((tc: any) => tc.classes.class_name)
        .filter((className: string | undefined) => className !== undefined) as string[];

      teamsMap.set(team.id, {
        id: team.id,
        name: team.name,
        captain: captain!,
        members,
        status: team.status,
        requiredRoles: requiredClasses.length ? requiredClasses : undefined
      });
    });

    // 9. Map competitions to include their teams
    const result = competitions.map(competition => {
      const competitionTeams = allTeamCompetitions
        ?.filter(tc => tc.competition_id === competition.id)
        .map(tc => teamsMap.get(tc.team_id))
        .filter(Boolean) as Team[] || [];

      return {
        ...competition,
        teams: competitionTeams
      };
    });

    return result;

  } catch (error) {
    console.error('Error fetching all competitions:', error);
    return null;
  }
};