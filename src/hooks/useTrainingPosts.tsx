import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface TrainingPost {
  id: string;
  student_id: string;
  class_id: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  training_date: string;
  created_at: string;
  updated_at?: string;
  student_name?: string;
  student_avatar_url?: string | null;
  reaction_count?: number;
  reactions_summary?: any;
}

export interface PostReaction {
  id: string;
  post_id: string;
  student_id: string;
  reaction_type: string;
  created_at: string;
}

export function useTrainingPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<TrainingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudentId();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('training-posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'training_posts'
          },
          () => {
            fetchPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, studentId]);

  async function fetchStudentId() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setStudentId(data?.id || null);
    } catch (error: any) {
      console.error("Error fetching student ID:", error);
    }
  }

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("training_posts_with_stats")
        .select("*")
        .order("training_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
    }
  }

  async function createPost(
    photo: File,
    caption: string,
    trainingDate: string
  ): Promise<boolean> {
    if (!studentId) {
      toast.error("Perfil de aluno não encontrado");
      return false;
    }

    try {
      // Get student's class_id
      const { data: enrollment } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", studentId)
        .limit(1)
        .maybeSingle();

      // Check if already posted today
      const { data: existingPost } = await supabase
        .from("training_posts")
        .select("id")
        .eq("student_id", studentId)
        .eq("training_date", trainingDate)
        .maybeSingle();

      if (existingPost) {
        toast.error("Você já postou uma foto para este dia!");
        return false;
      }

      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(photo);
      });
      const base64Image = await base64Promise;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return false;
      }

      // Process photo via edge function
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-training-photo',
        {
          body: {
            file: base64Image,
            fileName: photo.name,
            studentId: studentId,
          },
        }
      );

      if (processError || !processResult.success) {
        throw new Error(processResult?.error || 'Erro ao processar foto');
      }

      // Create post in database
      const { error: insertError } = await supabase
        .from("training_posts")
        .insert({
          student_id: studentId,
          class_id: enrollment?.class_id || null,
          photo_url: processResult.photoUrl,
          thumbnail_url: processResult.thumbnailUrl,
          caption: caption || null,
          training_date: trainingDate,
        });

      if (insertError) throw insertError;

      toast.success("Foto postada com sucesso! 💪");
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Erro ao criar post");
      return false;
    }
  }

  async function deletePost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("training_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast.success("Post deletado");
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao deletar post");
      return false;
    }
  }

  async function addReaction(postId: string, reactionType: string): Promise<boolean> {
    if (!studentId) {
      toast.error("Apenas alunos podem reagir aos posts");
      return false;
    }

    try {
      // Check if already reacted
      const { data: existing } = await supabase
        .from("post_reactions")
        .select("id, reaction_type")
        .eq("post_id", postId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from("post_reactions")
            .delete()
            .eq("id", existing.id);
        } else {
          // Update reaction
          await supabase
            .from("post_reactions")
            .update({ reaction_type: reactionType })
            .eq("id", existing.id);
        }
      } else {
        // Add new reaction
        await supabase
          .from("post_reactions")
          .insert({
            post_id: postId,
            student_id: studentId,
            reaction_type: reactionType,
          });
      }

      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      return false;
    }
  }

  async function getStreak(): Promise<number> {
    if (!studentId) return 0;

    try {
      const { data, error } = await supabase.rpc("get_training_streak", {
        p_student_id: studentId,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error("Error getting streak:", error);
      return 0;
    }
  }

  return {
    posts,
    loading,
    studentId,
    createPost,
    deletePost,
    addReaction,
    getStreak,
    refetch: fetchPosts,
  };
}
