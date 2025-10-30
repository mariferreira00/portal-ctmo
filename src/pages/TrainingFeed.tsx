import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Camera, Calendar, Trophy, TrendingUp } from "lucide-react";
import { CreateTrainingPost } from "@/components/training/CreateTrainingPost";
import { TrainingPostCard } from "@/components/training/TrainingPostCard";
import { useTrainingPosts } from "@/hooks/useTrainingPosts";
import { Badge } from "@/components/ui/badge";

const TrainingFeed = () => {
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

  useEffect(() => {
    if (studentId) {
      loadStats();
    }
  }, [studentId, posts]);

  async function loadStats() {
    const currentStreak = await getStreak();
    setStreak(currentStreak);

    // Count posts this month
    const now = new Date();
    const thisMonth = posts.filter((post) => {
      const postDate = new Date(post.training_date);
      return (
        postDate.getMonth() === now.getMonth() &&
        postDate.getFullYear() === now.getFullYear() &&
        post.student_id === studentId
      );
    });
    setPostsThisMonth(thisMonth.length);
  }

  const myPosts = posts.filter((post) => post.student_id === studentId);
  const classmatesPosts = posts.filter((post) => post.student_id !== studentId);

  if (!studentId) {
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
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Feed de Treinos
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Compartilhe seu progresso e inspire seus colegas
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed" className="gap-2">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Postar</span>
          </TabsTrigger>
          <TabsTrigger value="my-posts" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Meus Posts</span>
          </TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : classmatesPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classmatesPosts.map((post) => (
                <TrainingPostCard
                  key={post.id}
                  post={post}
                  onReaction={addReaction}
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

        {/* Create Tab */}
        <TabsContent value="create" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <CreateTrainingPost onSubmit={createPost} />
          </div>
        </TabsContent>

        {/* My Posts Tab */}
        <TabsContent value="my-posts" className="mt-6">
          {myPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPosts.map((post) => (
                <TrainingPostCard
                  key={post.id}
                  post={post}
                  onReaction={addReaction}
                  onDelete={deletePost}
                  canDelete={true}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                Você ainda não postou
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece sua jornada compartilhando sua primeira foto de treino!
              </p>
              <Badge variant="outline" className="text-primary border-primary">
                <Camera className="w-3 h-3 mr-1" />
                Clique em "Postar" para começar
              </Badge>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingFeed;
