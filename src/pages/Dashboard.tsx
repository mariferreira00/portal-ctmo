import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateAnnouncement } from "@/components/announcements/CreateAnnouncement";
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function fetchStats() {
      const [s, t, c] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
      ]);
      setStats({ students: s.count || 0, teachers: t.count || 0, classes: c.count || 0 });
    }
    
    async function fetchClasses() {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("active", true)
        .order("name");
      setClasses(data || []);
    }
    
    fetchStats();
    fetchClasses();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard Portal CTMO</h1>
        <p className="text-sm md:text-base text-muted-foreground">Visão geral do centro de treinamento</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { title: "Total de Alunos", value: stats.students, icon: Users },
          { title: "Professores", value: stats.teachers, icon: GraduationCap },
          { title: "Turmas Ativas", value: stats.classes, icon: UserCheck },
        ].map((stat, i) => (
          <Card key={i} className="p-6 hover:border-primary transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quadro de Avisos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Quadro de Avisos
          </h2>
          <CreateAnnouncement
            isAdmin={true}
            instructorClasses={classes}
            onSuccess={() => {
              // Announcements list will auto-refresh via realtime
            }}
          />
        </div>
        <AnnouncementsList
          canDelete
          onDelete={async (id) => {
            try {
              const { error } = await supabase
                .from("announcements")
                .delete()
                .eq("id", id);

              if (error) throw error;
              toast.success("Aviso excluído");
            } catch (error) {
              console.error("Error deleting announcement:", error);
              toast.error("Erro ao excluir aviso");
            }
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
