//FOR DELETE
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProfile(userId: string) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading };
}