import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Calendar, Award, Crown, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AchievementCard } from "@/components/achievements/AchievementCard";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  rarity: string;
}

interface UserAchievement {
  achievement_id: string;
  progress: number;
  completed: boolean;
  unlocked_at: string;
}

interface StudentProfile {
  id: string;
}

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (user) {
      fetchStudentProfile();
    }
  }, [user]);

  useEffect(() => {
    if (studentProfile) {
      fetchAchievements();
      fetchUserAchievements();
    }
  }, [studentProfile]);

  async function fetchStudentProfile() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setStudentProfile(data);
    } catch (error: any) {
      console.error("Error fetching student profile:", error);
      toast.error("Erro ao carregar perfil");
    }
  }

  async function fetchAchievements() {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("active", true)
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      toast.error("Erro ao carregar conquistas");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserAchievements() {
    if (!studentProfile) return;

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("student_id", studentProfile.id);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error: any) {
      console.error("Error fetching user achievements:", error);
    }
  }

  const getUserAchievementData = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievement_id === achievementId);
  };

  const filteredAchievements = React.useMemo(() => {
    return achievements.filter((achievement) => {
      if (activeCategory === "all") return true;
      
      // Mapear categorias em português para inglês
      const categoryMap: { [key: string]: string } = {
        "Presença": "attendance",
        "Treino": "training",
        "Marcos": "milestone",
        "Sequência": "streak"
      };
      
      return categoryMap[achievement.category] === activeCategory;
    });
  }, [achievements, activeCategory]);

  const completedCount = userAchievements.filter((ua) => ua.completed).length;
  const totalPoints = userAchievements
    .filter((ua) => ua.completed)
    .reduce((sum, ua) => {
      const achievement = achievements.find((a) => a.id === ua.achievement_id);
      return sum + (achievement?.points || 0);
    }, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!studentProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Conquistas</h1>
          <p className="text-muted-foreground">Complete seu perfil de aluno para começar a desbloquear conquistas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Conquistas</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Desbloqueie conquistas e acumule pontos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conquistas Desbloqueadas</p>
              <p className="text-2xl font-bold">
                {completedCount}/{achievements.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Pontos</p>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <Award className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              <p className="text-2xl font-bold">
                {achievements.length > 0 ? Math.round((completedCount / achievements.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements List */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Todas</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Presença</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Treino</span>
          </TabsTrigger>
          <TabsTrigger value="milestone" className="gap-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Marcos</span>
          </TabsTrigger>
          <TabsTrigger value="streak" className="gap-2">
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Sequência</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => {
              const userAchievement = getUserAchievementData(achievement.id);
              return (
                <AchievementCard
                  key={achievement.id}
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.icon}
                  category={achievement.category}
                  points={achievement.points}
                  rarity={achievement.rarity}
                  progress={userAchievement?.progress || 0}
                  requirementValue={achievement.requirement_value}
                  completed={userAchievement?.completed || false}
                  unlockedAt={userAchievement?.unlocked_at}
                />
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <Card className="p-12 text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma conquista encontrada</h3>
              <p className="text-muted-foreground">
                Não há conquistas nesta categoria
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;
