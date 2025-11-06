import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    is_system: boolean;
    created_at: string;
    class_name?: string;
    creator_name?: string;
  };
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function AnnouncementCard({ announcement, onDelete, canDelete }: AnnouncementCardProps) {
  return (
    <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 mt-1">
              {announcement.is_system ? (
                <Sparkles className="h-5 w-5 text-primary" />
              ) : (
                <Megaphone className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{announcement.title}</h3>
                {announcement.is_system ? (
                  <Badge variant="default" className="text-xs">
                    Sistema
                  </Badge>
                ) : announcement.class_name ? (
                  <Badge variant="secondary" className="text-xs">
                    {announcement.class_name}
                  </Badge>
                ) : null}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {format(new Date(announcement.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </span>
                {announcement.creator_name && (
                  <>
                    <span>•</span>
                    <span>{announcement.creator_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(announcement.id)}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}
