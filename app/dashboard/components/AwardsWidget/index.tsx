"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AwardsWidget({ userId }: { userId: string }) {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const { data, error } = await supabase
          .from('reward_for_user')
          .select('*')
          .eq('user', userId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setAwards(data || []);
      } catch (error) {
        console.error("Error fetching awards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, [userId]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span>Мои награды</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          <span>Мои награды</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {awards.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            У вас нет наград
          </div>
        ) : (
          <div className="space-y-3">
            {awards.map((award) => (
              <div key={award.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium capitalize">{award.reward.type}</h4>
                  <p className="text-sm text-gray-500">
                    {award.reward.competition || "General achievement"}
                  </p>
                </div>
              </div>
            ))}
            <Button 
              variant="ghost" 
              className="w-full mt-2"
              //change to PopUp window with Awards onClick={() => router.push('/dashboard/awards')}
            >
              Показать все награды
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}