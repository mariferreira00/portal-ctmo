import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementCard } from "./AnnouncementCard";
import { Loader2, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_system: boolean;
  created_at: string;
  class_id?: string;
  created_by: string;
}

interface AnnouncementsListProps {
  studentId?: string;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function AnnouncementsList({ studentId, onDelete, canDelete }: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

    // Realtime subscription
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  async function fetchAnnouncements() {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          classes (name),
          profiles!announcements_created_by_fkey (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formatted = (data || []).map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        is_system: announcement.is_system,
        created_at: announcement.created_at,
        class_name: announcement.classes?.name,
        creator_name: announcement.profiles?.full_name,
      }));

      setAnnouncements(formatted);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Nenhum aviso no momento</h3>
        <p className="text-muted-foreground">
          Fique atento! Avisos importantes aparecerão aqui.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
