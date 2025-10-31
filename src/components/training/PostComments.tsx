import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  post_id: string;
  student_id: string | null;
  teacher_id: string | null;
  comment: string;
  created_at: string;
  author_name?: string;
  author_avatar_url?: string;
  is_teacher?: boolean;
}

interface PostCommentsProps {
  postId: string;
  currentStudentId?: string;
  currentTeacherId?: string;
  postOwnerId: string;
}

export const PostComments = ({ postId, currentStudentId, currentTeacherId, postOwnerId }: PostCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  async function fetchComments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          students!post_comments_student_id_fkey (
            full_name,
            avatar_url
          ),
          teachers!post_comments_teacher_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithAuthorData = data.map((comment: any) => ({
        id: comment.id,
        post_id: comment.post_id,
        student_id: comment.student_id,
        teacher_id: comment.teacher_id,
        comment: comment.comment,
        created_at: comment.created_at,
        is_teacher: !!comment.teacher_id,
        author_name: comment.teacher_id 
          ? comment.teachers?.full_name 
          : comment.students?.full_name,
        author_avatar_url: comment.teacher_id 
          ? comment.teachers?.avatar_url 
          : comment.students?.avatar_url,
      }));

      setComments(commentsWithAuthorData);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    if (!currentStudentId && !currentTeacherId) return;

    setSubmitting(true);
    try {
      const insertData: any = {
        post_id: postId,
        comment: newComment.trim(),
      };

      if (currentTeacherId) {
        insertData.teacher_id = currentTeacherId;
      } else {
        insertData.student_id = currentStudentId;
      }

      const { error } = await supabase
        .from('post_comments')
        .insert(insertData);

      if (error) throw error;

      setNewComment("");
      toast.success("Comentário adicionado!");
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success("Comentário removido!");
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error("Erro ao remover comentário");
    }
  }

  const canDeleteComment = (comment: Comment) => {
    if (comment.is_teacher && currentTeacherId) {
      return comment.teacher_id === currentTeacherId;
    }
    return comment.student_id === currentStudentId || postOwnerId === currentStudentId;
  };

  return (
    <div className="space-y-4">
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.author_avatar_url || undefined} />
                <AvatarFallback className={cn(
                  "text-xs",
                  comment.is_teacher 
                    ? "bg-orange-500/20 text-orange-500" 
                    : "bg-primary/20 text-primary"
                )}>
                  {comment.author_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{comment.author_name}</p>
                    {comment.is_teacher && (
                      <span className="text-xs bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded">
                        Instrutor
                      </span>
                    )}
                  </div>
                  <p className="text-sm break-words">{comment.comment}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                  {canDeleteComment(comment) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentário..."
          maxLength={500}
          disabled={submitting}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newComment.trim() || submitting}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
