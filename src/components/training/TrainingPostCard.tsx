import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrainingPost } from "@/hooks/useTrainingPosts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PostComments } from "./PostComments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TrainingPostCardProps {
  post: TrainingPost;
  onReaction: (postId: string, reactionType: string) => void;
  onDelete?: (postId: string) => void;
  canDelete?: boolean;
  currentStudentId?: string;
  currentTeacherId?: string;
}

const REACTIONS = [
  { type: "fire", emoji: "🔥", label: "Fogo" },
  { type: "strong", emoji: "💪", label: "Forte" },
  { type: "clap", emoji: "👏", label: "Palmas" },
  { type: "star", emoji: "⭐", label: "Estrela" },
  { type: "hundred", emoji: "💯", label: "Cem" },
];

export const TrainingPostCard = ({
  post,
  onReaction,
  onDelete,
  canDelete,
  currentStudentId,
  currentTeacherId,
}: TrainingPostCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getReactionCount = (type: string) => {
    const reaction = post.reactions_summary?.find((r) => r.type === type);
    return reaction?.count || 0;
  };

  return (
    <Card className="overflow-hidden bg-card border-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.student_avatar_url || undefined} alt={post.student_name} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {post.student_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{post.student_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.training_date)}
            </p>
          </div>
        </div>

        {canDelete && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar este post? Esta ação não pode
                  ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(post.id)}>
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Image */}
      <div className="relative bg-muted aspect-square">
        {!imageLoaded && (
          <div className="w-full h-full animate-pulse bg-muted" />
        )}
        <img
          src={post.thumbnail_url || post.photo_url}
          alt="Training photo"
          className={`w-full h-full object-cover ${
            imageLoaded ? "block" : "hidden"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
      </div>

      {/* Reactions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {REACTIONS.map((reaction) => {
            const count = getReactionCount(reaction.type);
            return (
              <Button
                key={reaction.type}
                variant={count > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => onReaction(post.id, reaction.type)}
                className="gap-1"
              >
                <span>{reaction.emoji}</span>
                {count > 0 && <span className="text-xs">{count}</span>}
              </Button>
            );
          })}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-foreground">
            <span className="font-semibold">{post.student_name}: </span>
            {post.caption}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>

        {/* Comments Section */}
        {(currentStudentId || currentTeacherId) && (
          <Collapsible open={commentsOpen} onOpenChange={setCommentsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Comentários</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <PostComments
                postId={post.id}
                currentStudentId={currentStudentId}
                currentTeacherId={currentTeacherId}
                postOwnerId={post.student_id}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  );
};
