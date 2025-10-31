import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (position: number) => {
    if (position <= 3) {
      return (
        <Badge
          variant="default"
          className={
            position === 1
              ? "bg-yellow-500"
              : position === 2
              ? "bg-gray-400"
              : "bg-orange-600"
          }
        >
          #{position}
        </Badge>
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
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Ranking Semanal</h2>
            <p className="text-sm text-muted-foreground">
              Top 10 alunos mais ativos esta semana
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {ranking.map((entry, index) => (
            <div
              key={entry.student_id}
              className={`
                flex items-center gap-4 p-4 rounded-lg transition-all
                ${
                  index < 3
                    ? "bg-primary/5 border-2 border-primary/20"
                    : "bg-muted/50"
                }
              `}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 min-w-[60px]">
                  {getRankIcon(index + 1) || getRankBadge(index + 1)}
                </div>

                <Avatar className="w-12 h-12">
                  <AvatarImage src={entry.student_avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {entry.student_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.student_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.checkin_count} {entry.checkin_count === 1 ? "check-in" : "check-ins"} •{" "}
                    {entry.post_count} {entry.post_count === 1 ? "foto" : "fotos"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{entry.score}</p>
                <p className="text-xs text-muted-foreground">pontos</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Sistema de Pontuação:</strong> 2 pontos por check-in + 1 ponto por
            foto postada
          </p>
        </div>
      </Card>
    </div>
  );
};
