import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: "reaction" | "comment";
  post_id: string;
  from_student_id: string;
  from_student_name?: string;
  from_student_avatar?: string;
  reaction_type?: string;
  comment_text?: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  studentId: string;
}

const REACTION_EMOJIS: Record<string, string> = {
  fire: "🔥",
  strong: "💪",
  clap: "👏",
  star: "⭐",
  hundred: "💯",
};

export const NotificationBell = ({ studentId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`notifications-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          students!notifications_from_student_id_fkey (
            full_name,
            avatar_url
          )
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const notificationsWithStudentData = data.map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        post_id: notif.post_id,
        from_student_id: notif.from_student_id,
        from_student_name: notif.students?.full_name,
        from_student_avatar: notif.students?.avatar_url,
        reaction_type: notif.reaction_type,
        comment_text: notif.comment_text,
        read: notif.read,
        created_at: notif.created_at,
      }));

      setNotifications(notificationsWithStudentData);
      setUnreadCount(notificationsWithStudentData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("student_id", studentId)
        .eq("read", false);

      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  const getNotificationText = (notification: Notification) => {
    if (notification.type === "reaction") {
      const emoji = REACTION_EMOJIS[notification.reaction_type || ""] || "👍";
      return (
        <>
          <span className="font-semibold">{notification.from_student_name}</span>{" "}
          reagiu ao seu post com {emoji}
        </>
      );
    } else {
      return (
        <>
          <span className="font-semibold">{notification.from_student_name}</span>{" "}
          comentou: "{notification.comment_text}"
        </>
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como lida
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  p-4 border-b cursor-pointer transition-colors
                  ${notification.read ? "opacity-60" : "bg-primary/5"}
                  hover:bg-muted/50
                `}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={notification.from_student_avatar || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {notification.from_student_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{getNotificationText(notification)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
