import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Achievement {
  name: string;
  description: string;
  points: number;
  rarity: string;
  icon: string;
}

export function useAchievementNotifications() {
  const { user } = useAuth();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Get student ID
  useEffect(() => {
    if (!user) return;

    async function getStudentId() {
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data) {
        setStudentId(data.id);
      }
    }

    getStudentId();
  }, [user]);

  // Listen for new achievements
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel(`user_achievements:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_achievements",
          filter: `student_id=eq.${studentId}`,
        },
        async (payload: any) => {
          // Check if achievement was just completed
          const newData = payload.new;
          const oldData = payload.old;

          if (newData.completed && !oldData.completed) {
            // Fetch achievement details
            const { data: achievement } = await supabase
              .from("achievements")
              .select("name, description, points, rarity, icon")
              .eq("id", newData.achievement_id)
              .single();

            if (achievement) {
              setNewAchievement(achievement);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return { newAchievement, clearAchievement: () => setNewAchievement(null) };
}
