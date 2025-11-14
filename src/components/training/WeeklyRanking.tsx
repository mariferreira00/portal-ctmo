import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, CheckCircle2 } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RankingEntry {
  student_id: string;
  student_name: string;
  student_avatar_url: string | null;
  post_count: number;
  checkin_count: number;
  score: number;
}

export const WeeklyRanking = () => {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyRanking();
  }, []);

  async function fetchWeeklyRanking() {
    try {
      setLoading(true);
      const weekStart = startOfWeek(new Date(), { locale: ptBR });
      const weekEnd = endOfWeek(new Date(), { locale: ptBR });

      // Get posts from this week
      const { data: posts, error: postsError } = await supabase
        .from("training_posts")
        .select("student_id, students(full_name, avatar_url)")
        .gte("training_date", format(weekStart, "yyyy-MM-dd"))
        .lte("training_date", format(weekEnd, "yyyy-MM-dd"));

      if (postsError) throw postsError;

      // Get check-ins from this week
      const { data: checkins, error: checkinsError } = await supabase
        .from("attendance")
        .select("student_id, students(full_name, avatar_url)")
        .gte("checked_in_at", weekStart.toISOString())
        .lte("checked_in_at", weekEnd.toISOString());

      if (checkinsError) throw checkinsError;

      // Aggregate by student
      const studentStats = new Map<string, RankingEntry>();

      // Count posts (1 point each)
      posts?.forEach((post) => {
        const student = post.students as any;
        const existing = studentStats.get(post.student_id);

        if (existing) {
          existing.post_count += 1;
          existing.score += 1;
        } else {
          studentStats.set(post.student_id, {
            student_id: post.student_id,
            student_name: student?.full_name || "Anônimo",
            student_avatar_url: student?.avatar_url,
            post_count: 1,
            checkin_count: 0,
            score: 1,
          });
        }
      });

      // Count check-ins (2 points each)
      checkins?.forEach((checkin) => {
        const student = checkin.students as any;
        const existing = studentStats.get(checkin.student_id);

        if (existing) {
          existing.checkin_count += 1;
          existing.score += 2;
        } else {
          studentStats.set(checkin.student_id, {
            student_id: checkin.student_id,
            student_name: student?.full_name || "Anônimo",
            student_avatar_url: student?.avatar_url,
            post_count: 0,
            checkin_count: 1,
            score: 2,
          });
        }
      });

      // Sort by score
      const sortedRanking = Array.from(studentStats.values()).sort(
        (a, b) => b.score - a.score
      );

      setRanking(sortedRanking.slice(0, 10)); // Top 10
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-8 h-8 text-[hsl(var(--rank-gold))] drop-shadow-lg" />;
      case 2:
        return <Medal className="w-8 h-8 text-[hsl(var(--rank-silver))] drop-shadow-lg" />;
      case 3:
        return <Award className="w-8 h-8 text-[hsl(var(--rank-bronze))] drop-shadow-lg" />;
      default:
        return null;
    }
  };

  const getRankBadge = (position: number) => {
    if (position <= 3) {
      const gradients = {
        1: "bg-gradient-to-br from-[hsl(var(--rank-gold))] to-yellow-600",
        2: "bg-gradient-to-br from-[hsl(var(--rank-silver))] to-gray-500",
        3: "bg-gradient-to-br from-[hsl(var(--rank-bronze))] to-orange-700"
      };
      
      return (
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-2xl animate-bounce-in",
          gradients[position as 1 | 2 | 3]
        )}>
          {position}º
        </div>
      );
    }
    
    return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Carregando ranking...</p>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhum dado esta semana</h3>
        <p className="text-muted-foreground">
          Poste fotos de treino para aparecer no ranking!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/80 border-border hover-lift animate-slide-up overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg">
          <Trophy className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Ranking Semanal</h3>
          <p className="text-xs text-muted-foreground">Top 10 da semana</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {ranking.map((entry, index) => {
          const position = index + 1;
          const isTopThree = position <= 3;

          return (
            <div
              key={entry.student_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover-lift animate-slide-up",
                isTopThree
                  ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 shadow-lg"
                  : "bg-muted/30 hover:bg-muted/50 border border-border/50"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                {isTopThree ? (
                  <div className="flex flex-col items-center gap-1">
                    {getRankIcon(position)}
                    {getRankBadge(position)}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-muted-foreground">{position}</span>
                  </div>
                )}
              </div>

              <Avatar className={cn(
                "transition-all duration-300",
                isTopThree ? "w-14 h-14 border-2 border-primary shadow-lg" : "w-12 h-12"
              )}>
                <AvatarImage src={entry.student_avatar_url || undefined} />
                <AvatarFallback className={cn(
                  isTopThree && "bg-primary/20 text-primary font-bold"
                )}>
                  {entry.student_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "truncate",
                  isTopThree ? "font-bold text-lg" : "font-semibold"
                )}>
                  {entry.student_name}
                </p>
                <div className="flex gap-3 text-xs mt-1">
                  <span className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full",
                    isTopThree ? "bg-primary/20 text-primary font-semibold" : "bg-muted text-muted-foreground"
                  )}>
                    <CheckCircle2 className="w-3 h-3" />
                    {entry.checkin_count} check-ins
                  </span>
                  <span className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full",
                    isTopThree ? "bg-primary/20 text-primary font-semibold" : "bg-muted text-muted-foreground"
                  )}>
                    📸 {entry.post_count} posts
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className={cn(
                  "px-4 py-2 rounded-xl",
                  isTopThree ? "bg-primary/20" : "bg-muted"
                )}>
                  <p className={cn(
                    "font-bold",
                    isTopThree ? "text-2xl text-primary" : "text-xl text-foreground"
                  )}>
                    {entry.score}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">pontos</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50 relative z-10">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Sistema de Pontuação:</strong> 2 pontos por check-in • 1 ponto por foto postada
        </p>
      </div>
    </Card>
  );
};
