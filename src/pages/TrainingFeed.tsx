import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Camera, Calendar, Trophy, TrendingUp } from "lucide-react";
import { CreateTrainingPost } from "@/components/training/CreateTrainingPost";
import { TrainingPostCard } from "@/components/training/TrainingPostCard";
import { TrainingCalendar } from "@/components/training/TrainingCalendar";
import { WeeklyRanking } from "@/components/training/WeeklyRanking";
import { NotificationBell } from "@/components/training/NotificationBell";
import { useTrainingPosts } from "@/hooks/useTrainingPosts";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toBrasiliaTime, getBrasiliaTime } from "@/lib/timezone";

const TrainingFeed = () => {
  const { user } = useAuth();
  const { isInstructor, isAdmin } = useUserRole();
  const {
    posts,
    loading,
    studentId,
    createPost,
    deletePost,
    addReaction,
    getStreak,
  } = useTrainingPosts();
  const [activeTab, setActiveTab] = useState("feed");
  const [streak, setStreak] = useState(0);
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (user && isInstructor) {
      fetchTeacherId();
    }
  }, [user, isInstructor]);

  async function fetchTeacherId() {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setTeacherId(data.id);
    } catch (error: any) {
      console.error("Error fetching teacher ID:", error);
    }
  }

  useEffect(() => {
    if (studentId) {
      loadStats();
    }
  }, [studentId, posts]);

  async function loadStats() {
    const currentStreak = await getStreak();
    setStreak(currentStreak);

    // Count posts this month
    const now = getBrasiliaTime();
    const thisMonth = posts.filter((post) => {
      const postDate = toBrasiliaTime(post.training_date);
      return (
        postDate.getMonth() === now.getMonth() &&
        postDate.getFullYear() === now.getFullYear() &&
        post.student_id === studentId
      );
    });
    setPostsThisMonth(thisMonth.length);
  }

  const myPosts = posts.filter((post) => post.student_id === studentId);

  if (!studentId && !isInstructor && !isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Feed de Treinos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Complete seu perfil de aluno para começar a postar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Feed de Treinos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Compartilhe seu progresso e inspire seus colegas
          </p>
        </div>
        {studentId && <NotificationBell studentId={studentId} />}
      </div>

      {/* Stats Cards */}
      {studentId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sequência Atual</p>
                <p className="text-2xl font-bold text-foreground">
                  {streak} dias 🔥
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posts este Mês</p>
                <p className="text-2xl font-bold text-foreground">{postsThisMonth}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Posts</p>
                <p className="text-2xl font-bold text-foreground">{myPosts.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={studentId ? "grid w-full grid-cols-4" : "grid w-full grid-cols-1"}>
          <TabsTrigger value="feed" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          {studentId && (
            <>
              <TabsTrigger value="ranking" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Ranking</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendário</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Postar</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <TrainingPostCard
                  key={post.id}
                  post={post}
                  onReaction={addReaction}
                  onDelete={post.student_id === studentId || isAdmin ? deletePost : undefined}
                  canDelete={post.student_id === studentId || isAdmin}
                  currentStudentId={studentId || undefined}
                  currentTeacherId={teacherId || undefined}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhum post ainda</h3>
              <p className="text-muted-foreground">
                Seja o primeiro a postar uma foto de treino!
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-6">
          <WeeklyRanking />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6">
          <TrainingCalendar 
            posts={myPosts} 
            currentMonth={currentMonth}
            streak={streak}
          />
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <CreateTrainingPost onSubmit={createPost} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingFeed;
