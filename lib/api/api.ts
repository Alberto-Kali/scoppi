import { supabase } from "@/lib/supabaseClient";
import { Team, Competition, User } from "@/app/dashboard/components/types";

type UserTeamRole = string; // Add other roles as needed

export type NotificationType = "instant" | "invite" | "moderation";


export const AwardService = {
  async addUserReward(userId: string, rewardData: any, competitionId?: string) {
    const { data, error } = await supabase
      .from('reward_for_user')
      .insert([{
        user: userId,
        reward: rewardData,
        competition_id: competitionId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserRewards(userId: string) {
    const { data, error } = await supabase
      .from('reward_for_user')
      .select('*')
      .eq('user', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async sendAwardNotification(userId: string, rewardData: any, senderId: string) {
    let message = '';
    const metadata: any = { reward: rewardData };

    if (rewardData.competition) {
      message = `Вы получили награду "${rewardData.type}" за участие в соревновании "${rewardData.competition}"`;
      metadata.competitionId = rewardData.competitionId;
    } else {
      message = `Вы получили награду "${rewardData.type}"`;
    }

    return await NotificationService.createNotification(
      userId,
      message,
      "instant",
      metadata,
      "/dashboard/awards",
      senderId
    );
  }
};

export interface Notification {
  id: number;
  created_at: string;
  to_user: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  metadata?: any;
  action_url?: string;
  sender_id?: string;
}

export const NotificationService = {
  // Create a new notification
  async createNotification(
    toUser: string,
    content: string,
    type: NotificationType,
    metadata?: any,
    actionUrl?: string,
    senderId?: string
  ): Promise<Notification | null> {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        to_user: toUser,
        content,
        type,
        metadata,
        action_url: actionUrl,
        sender_id: senderId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return null;
    }
    return data;
  },

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    type?: NotificationType
  ): Promise<Notification[]> {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("to_user", userId)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
    return data || [];
  },

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
    return true;
  },

  // Delete a notification
  async deleteNotification(notificationId: number): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
    return true;
  },

  // Create specific notification types
  async createTeamInvite(
    toUser: string,
    teamId: string,
    teamName: string,
    senderId: string,
    senderName: string
  ): Promise<Notification | null> {
    return this.createNotification(
      toUser,
      `${senderName} invited you to join team ${teamName}`,
      "invite",
      { teamId, teamName, senderId, senderName },
      `/teams/${teamId}`,
      senderId
    );
  },

  async createModerationRequest(
    toUser: string,
    content: string,
    actionType: string,
    entityId: string,
    entityType: string,
    senderId?: string
  ): Promise<Notification | null> {
    return this.createNotification(
      toUser,
      content,
      "moderation",
      { actionType, entityId, entityType },
      `/${entityType}s/${entityId}`,
      senderId
    );
  },
};

export const fetchUserProfile = async (
  userId: string
): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      age: data.age,
      class: data.class,
      region: data.region,
      role: data.role,
      teams: [],
    };

    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const fetchUserTeams = async (
  userId: string
): Promise<Team[] | null> => {
  try {
    // 1. Get all team memberships for this user (excluding banned users)
    const { data: userTeams, error: userTeamsError } = await supabase
      .from("user_to_team")
      .select("team_id, role")
      .eq("user_id", userId)
      .neq("role", "banned");

    if (userTeamsError) throw userTeamsError;
    if (!userTeams?.length) return [];

    // 2. Get full team data for each team
    const teamIds = userTeams.map((ut) => ut.team_id);
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds);

    if (teamsError) throw teamsError;
    if (!teams?.length) return [];

    // 3. Get all team members for each team
    const { data: allTeamMemberships, error: membersError } = await supabase
      .from("user_to_team")
      .select("user_id, team_id, role")
      .in("team_id", teamIds)
      .neq("role", "banned");

    if (membersError) throw membersError;

    // 4. Get user data for all team members
    const memberUserIds = allTeamMemberships.map((m) => m.user_id);
    const { data: memberUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberUserIds);

    if (usersError) throw usersError;
    if (!memberUsers?.length) return [];

    // 5. Get required classes for each team
    const { data: teamClasses, error: classesError } = await supabase
      .from("class_to_team")
      .select(
        `
        team_id, 
        classes (id, class_name)
      `
      )
      .in("team_id", teamIds);

    if (classesError) throw classesError;

    // 6. Construct the final Team objects
    const resultTeams: Team[] = teams.map((team) => {
      const teamMemberships = allTeamMemberships.filter(
        (m) => m.team_id === team.id
      );

      // Find captain
      const captainMembership = teamMemberships.find(
        (m) => m.role === "captain"
      );
      const captain = captainMembership
        ? memberUsers.find((u) => u.id === captainMembership.user_id)!
        : null;

      if (!captain) {
        throw new Error(`No captain found for team ${team.id}`);
      }

      // Find regular members (excluding captain)
      const memberIds = teamMemberships
        .filter((m) => m.role !== "captain")
        .map((m) => m.user_id);
      const members = memberUsers.filter((u) => memberIds.includes(u.id));

      // Find required classes with proper type handling
      const requiredClasses = (teamClasses || [])
        .filter((tc: any) => tc.team_id === team.id && tc.classes)
        .map((tc: any) => tc.classes.class_name)
        .filter(
          (className: string | undefined) => className !== undefined
        ) as string[];

      return {
        id: team.id,
        name: team.name,
        captain,
        members,
        status: team.status,
        requiredRoles: requiredClasses.length ? requiredClasses : undefined,
        region: team.region, // Added from new schema
      };
    });

    return resultTeams;
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return null;
  }
};

export const getCompetitions = async (
  status?: Competition["status"],
  id?: Competition["id"]
): Promise<Competition[] | null> => {
  try {
    // 1. Get competitions with optional status filter
    let query = supabase
      .from("competitions")
      .select("*")
      .order("event_start", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }
    if (id) {
      query = query.eq("id", id);
    }

    const { data: competitions, error: competitionsError } = await query;
    if (competitionsError) throw competitionsError;
    if (!competitions?.length) return [];

    // 2. Get all team-to-competition mappings in one query
    const competitionIds = competitions.map((c) => c.id);
    const { data: allTeamCompetitions, error: teamCompError } = await supabase
      .from("team_to_competition")
      .select("competition_id, team_id")
      .in("competition_id", competitionIds);

    if (teamCompError) throw teamCompError;

    // 3. Get all unique team IDs
    const teamIds = [
      ...new Set(allTeamCompetitions?.map((tc) => tc.team_id) || []),
    ];

    // 4. Get regions for competitions in one query
    const { data: competitionRegions, error: regionsError } = await supabase
      .from("regions_to_competitions")
      .select("competition_id, regions!inner(name)")
      .in("competition_id", competitionIds);

    if (regionsError) throw regionsError;

    // Create regions map
    const regionsMap = new Map<string, string[]>();

    competitionRegions.forEach((cr) => {
      const current = regionsMap.get(cr.competition_id) || [];
      if (cr.regions && cr.regions.name && cr.competition_id) {
        regionsMap.set(cr.competition_id, [...current, cr.regions.name]);
      }
    });

    // Early return if no teams found (but include regions)
    if (teamIds.length === 0) {
      return competitions.map((competition) => ({
        ...transformCompetitionData(competition),
        regions: regionsMap.get(competition.id) || [],
        teams: [],
      }));
    }

    // 5. Get full team data for all teams in one query
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds);

    if (teamsError) throw teamsError;

    // 6. Get all team memberships in one query
    const { data: allTeamMemberships, error: membersError } = await supabase
      .from("user_to_team")
      .select("user_id, team_id, role")
      .in("team_id", teamIds)
      .neq("role", "banned");

    if (membersError) throw membersError;

    // 7. Get all user data for members in one query
    const memberUserIds = [
      ...new Set(allTeamMemberships?.map((m) => m.user_id) || []),
    ];
    const { data: memberUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberUserIds);

    if (usersError) throw usersError;

    // 8. Get all required classes for teams in one query
    const { data: teamClasses, error: classesError } = await supabase
      .from("class_to_team")
      .select("team_id, classes!inner(id, class_name)")
      .in("team_id", teamIds);

    if (classesError) throw classesError;

    // 9. Create a map of team_id to Team object for efficient lookup
    const teamsMap = new Map<number, Team>();

    (teams || []).forEach((team) => {
      const teamMemberships =
        allTeamMemberships?.filter((m) => m.team_id === team.id) || [];

      // Find captain
      const captainMembership = teamMemberships.find(
        (m) => m.role === "captain"
      );
      const captain =
        captainMembership &&
        memberUsers?.find((u) => u.id === captainMembership.user_id);

      if (!captain) {
        console.warn(`No captain found for team ${team.id}`);
      }

      // Find members
      const memberIds = teamMemberships.map((m) => m.user_id);
      const members =
        memberUsers?.filter((u) => memberIds.includes(u.id)) || [];

      // Get required classes
      const requiredClasses = (teamClasses || [])
        .filter((tc: any) => tc.team_id === team.id && tc.classes)
        .map((tc: any) => tc.classes.class_name)
        .filter(
          (className: string | undefined) => className !== undefined
        ) as string[];

      teamsMap.set(team.id, {
        id: team.id,
        name: team.name,
        captain: captain!,
        members,
        status: team.status,
        maxTeamMembers: team.maxTeamMembers,
        requiredRoles: requiredClasses.length ? requiredClasses : undefined,
        region: team.region,
      });
    });

    // 10. Map competitions to include their teams and regions
    const result = competitions.map((competition) => {
      const competitionTeams =
        allTeamCompetitions
          ?.filter((tc) => tc.competition_id === competition.id)
          .map((tc) => teamsMap.get(tc.team_id))
          .filter((team): team is Team => team !== undefined) || [];

      return {
        ...transformCompetitionData(competition),
        regions: regionsMap.get(competition.id) || [],
        teams: competitionTeams,
      };
    });

    return result;
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return null;
  }
};

const transformCompetitionData = (
  competition: any
): Omit<Competition, "teams" | "regions"> => {
  return {
    id: competition.id,
    title: competition.title,
    type: competition.type as Competition["type"],
    discipline: competition.discipline,
    registrationStart: competition.registration_start,
    registrationEnd: competition.registration_end,
    eventStart: competition.event_start,
    eventEnd: competition.event_end,
    maxParticipants: competition.max_participants || 0,
    maxTeamMembers: competition.maxTeamMembers,
    status: competition.status as Competition["status"],
    description: competition.description || "",
  };
};

export const getCompetitionDetails = async (
  id: string
): Promise<Competition | null> => {
  try {
    const { data, error } = await supabase
      .from("competitions")
      .select(
        `
        *,
        regions_to_competitions:regions_to_competitions(
          regions(name)
        ),
        team_to_competition:team_to_competition(
          team_id,
          teams(
            *,
            user_to_team(
              user_id,
              role,
              profiles(*)
            )
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Transform teams data to match your Team type
    const teams: Team[] =
      data.team_to_competition?.map((ttc: any) => {
        const team = ttc.teams;
        const memberships = team.user_to_team;

        const captainMembership = memberships.find(
          (m: any) => m.role === "captain"
        );
        const captain = captainMembership?.profiles;

        const members = memberships
          .filter((m: any) => m.role !== "captain")
          .map((m: any) => m.profiles);

        return {
          id: team.id,
          name: team.name,
          captain,
          members,
          status: team.status,
          region: team.region,
        };
      }) || [];

    return {
      id: data.id,
      title: data.title,
      type: data.type as Competition["type"],
      discipline: data.discipline,
      registrationStart: data.registration_start,
      registrationEnd: data.registration_end,
      eventStart: data.event_start,
      eventEnd: data.event_end,
      regions:
        data.regions_to_competitions?.map((rtc: any) => rtc.regions.name) || [],
      maxParticipants: data.max_participants || 0,
      status: data.status as Competition["status"],
      description: data.description || "",
      teams,
    };
  } catch (error) {
    console.error("Error fetching competition details:", error);
    return null;
  }
};

export const addCompetition = async (
  competitionData: Omit<Competition, "id" | "teams">
) => {
  try {
    // Start a transaction
    const { data: competition, error: compError } = await supabase
      .from("competitions")
      .insert([
        {
          title: competitionData.title,
          type: competitionData.type,
          discipline: competitionData.discipline,
          registration_start: competitionData.registrationStart,
          registration_end: competitionData.registrationEnd,
          event_start: competitionData.eventStart,
          event_end: competitionData.eventEnd,
          max_participants: competitionData.maxParticipants,
          status: competitionData.status,
          description: competitionData.description,
        },
      ])
      .select()
      .single();

    if (compError) throw compError;
    if (!competition) throw new Error("Failed to create competition");

    // Add regions if provided
    if (competitionData.regions && competitionData.regions.length > 0) {
      // First get region IDs from names
      const { data: regions, error: regionsError } = await supabase
        .from("regions")
        .select("id")
        .in("name", competitionData.regions);

      if (regionsError) throw regionsError;

      if (regions && regions.length > 0) {
        const regionLinks = regions.map((region) => ({
          competition_id: competition.id,
          region_id: region.id,
        }));

        const { error: linkError } = await supabase
          .from("regions_to_competitions")
          .insert(regionLinks);

        if (linkError) throw linkError;
      }
    }

    return {
      ...competition,
      registrationStart: competition.registration_start,
      registrationEnd: competition.registration_end,
      eventStart: competition.event_start,
      eventEnd: competition.event_end,
      regions: competitionData.regions,
      maxParticipants: competition.max_participants || 0,
      teams: [],
    } as Competition;
  } catch (error) {
    console.error("Error adding competition:", error);
    return null;
  }
};

export const updateCompetition = async (
  id: string,
  competitionData: Partial<Omit<Competition, "id" | "teams">>
): Promise<Competition | null> => {
  try {
    // Update competition basic info
    const { data: competition, error: compError } = await supabase
      .from("competitions")
      .update({
        title: competitionData.title,
        type: competitionData.type,
        discipline: competitionData.discipline,
        registration_start: competitionData.registrationStart,
        registration_end: competitionData.registrationEnd,
        event_start: competitionData.eventStart,
        event_end: competitionData.eventEnd,
        max_participants: competitionData.maxParticipants,
        status: competitionData.status,
        description: competitionData.description,
      })
      .eq("id", id)
      .select()
      .single();

    if (compError) throw compError;
    if (!competition) throw new Error("Competition not found");

    // Update regions if provided
    if (competitionData.regions) {
      // First delete all existing region links
      const { error: deleteError } = await supabase
        .from("regions_to_competitions")
        .delete()
        .eq("competition_id", id);

      if (deleteError) throw deleteError;

      // Then add new ones if regions were provided
      if (competitionData.regions.length > 0) {
        // Get region IDs from names
        const { data: regions, error: regionsError } = await supabase
          .from("regions")
          .select("id")
          .in("name", competitionData.regions);

        if (regionsError) throw regionsError;

        if (regions && regions.length > 0) {
          const regionLinks = regions.map((region) => ({
            competition_id: id,
            region_id: region.id,
          }));

          const { error: linkError } = await supabase
            .from("regions_to_competitions")
            .insert(regionLinks);

          if (linkError) throw linkError;
        }
      }
    }

    // Fetch the updated competition with regions
    return await getCompetitionDetails(id);
  } catch (error) {
    console.error("Error updating competition:", error);
    return null;
  }
};

export const changeUserRole = async (
  userId: string,
  teamId: number,
  newRole: UserTeamRole
) => {
  try {
    const { data, error } = await supabase
      .from("user_to_team")
      .update({ role: newRole })
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error changing user role:", error);
    return null;
  }
};

export const addUserToTeam = async (
  userId: string,
  teamId: number,
  role: UserTeamRole
) => {
  try {
    const { data, error } = await supabase
      .from("user_to_team")
      .insert([{ user_id: userId, team_id: teamId, role }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding user to team:", error);
    return null;
  }
};

export const removeUserFromTeam = async (userId: string, teamId: number) => {
  try {
    const { error } = await supabase
      .from("user_to_team")
      .delete()
      .eq("user_id", userId)
      .eq("team_id", teamId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing user from team:", error);
    return false;
  }
};

export const registerTeamForCompetition = async (
  teamId: number,
  competitionId: string,
  status: "on_moderation"
) => {
  try {
    const { data, error } = await supabase
      .from("team_to_competition")
      .insert([{ team_id: teamId, competition_id: competitionId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error registering team for competition:", error);
    return null;
  }
};

export const getTeamCompetitions = async (teamId: number) => {
  try {
    const { data, error } = await supabase
      .from("team_to_competition")
      .select(
        `
        competition_id,
        competitions (*)
      `
      )
      .eq("team_id", teamId);

    if (error) throw error;
    return data?.map((item) => item.competitions) as Competition[] | null;
  } catch (error) {
    console.error("Error fetching team competitions:", error);
    return null;
  }
};

export const createTeam = async (teamData: {
  name: string;
  region: number;
}) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .insert([{ ...teamData, status: "active" }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating team:", error);
    return null;
  }
};

export const updateTeam = async (
  teamId: number,
  teamData: Partial<{ name: string; status: string; region: number }>
) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .update(teamData)
      .eq("id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating team:", error);
    return null;
  }
};

export const getTeamDetails = async (teamId: number) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        user_to_team (
          user_id,
          role,
          profiles (*)
        ),
        class_to_team (
          class_id,
          classes (class_name)
        )
      `
      )
      .eq("id", teamId)
      .single();

    if (error) throw error;
    const team: Team = {
      id: data.id,
      name: data.name,
      status: data.status,
      captain: data.captain,
      region: data.region_id,
      members: data.members,
      maxTeamMembers: data.maxTeamMembers,
      requiredRoles: data.requiredRoles,
    };
    return data;
  } catch (error) {
    console.error("Error fetching team details:", error);
    return null;
  }
};

export const getClasses = async () => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("class_name", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching classes:", error);
    return null;
  }
};

export const getRegions = async () => {
  try {
    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching regions:", error);
    return null;
  }
};

export const getTeamByID = async (team_id: number): Promise<Team | null> => {
  try {
    // 1. Get the team data
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", team_id)
      .single();

    if (teamError) throw teamError;
    if (!team) return null;

    // 2. Get team memberships (excluding banned members)
    const { data: teamMemberships, error: membersError } = await supabase
      .from("user_to_team")
      .select("user_id, team_id, role")
      .eq("team_id", team_id)
      .neq("role", "banned");

    if (membersError) throw membersError;

    // 3. Get user data for all members
    const memberUserIds = teamMemberships?.map((m) => m.user_id) || [];
    const { data: memberUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberUserIds);

    if (usersError) throw usersError;

    // 4. Find captain
    const captainMembership = teamMemberships?.find(
      (m) => m.role === "captain"
    );
    const captain =
      captainMembership &&
      memberUsers?.find((u) => u.id === captainMembership.user_id);

    if (!captain) {
      console.warn(`No captain found for team ${team_id}`);
    }

    // 5. Get members
    const members =
      memberUsers?.filter((u) =>
        teamMemberships?.some((m) => m.user_id === u.id)
      ) || [];

    // 6. Get required classes for the team
    const { data: teamClasses, error: classesError } = await supabase
      .from("class_to_team")
      .select("team_id, classes!inner(id, class_name)")
      .eq("team_id", team_id);

    if (classesError) throw classesError;

    const requiredClasses = (teamClasses || [])
      .filter((tc: any) => tc.classes)
      .map((tc: any) => tc.classes.class_name)
      .filter(
        (className: string | undefined) => className !== undefined
      ) as string[];

    // 7. Construct the Team object
    const result: Team = {
      id: team.id,
      name: team.name,
      captain: captain!,
      members,
      status: team.status,
      maxTeamMembers: team.maxTeamMembers,
      requiredRoles: requiredClasses.length ? requiredClasses : undefined,
      region: team.region,
    };

    return result;
  } catch (error) {
    console.error(`Error fetching team with ID ${team_id}:`, error);
    return null;
  }
};

export const submitTeamsToCompetition = async (teamIds: string[], competitionId: string) => {
  const { data, error } = await supabase
    .from('team_to_competition')
    .insert(teamIds.map(teamId => ({
      team_id: teamId,
      competition_id: competitionId,
      status: 'pending'
    })))
    .select();

  if (error) throw error;
  return data;
};

export const approveTeamsForCompetition = async (teamIds: string[], competitionId: string) => {
  const { data, error } = await supabase
    .from('team_to_competition')
    .update({ status: 'approved' })
    .in('team_id', teamIds)
    .eq('competition_id', competitionId)
    .select();

  if (error) throw error;
  return data;
};