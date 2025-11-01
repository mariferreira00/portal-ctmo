import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, CheckCircle2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { TutorialManager } from "@/components/onboarding/TutorialManager";

interface ClassWithEnrollments {
  id: string;
  name: string;
  schedule: string;
  max_students: number;
  enrollments: { student_id: string }[];
}

interface AttendanceRecord {
  checked_in_at: string;
  students: {
    full_name: string;
  } | null;
  classes: {
    name: string;
  } | null;
}

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassWithEnrollments[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInstructorData();
    }
  }, [user]);

  async function fetchInstructorData() {
    try {
      // Buscar o teacher_id do instrutor logado
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacherData) {
        setLoading(false);
        return;
      }

      // Buscar turmas do instrutor com matrículas
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          schedule,
          max_students,
          class_enrollments (
            student_id
          )
        `)
        .eq("teacher_id", teacherData.id)
        .eq("active", true);

      if (classesError) throw classesError;
      
      const formattedClasses = (classesData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        schedule: c.schedule,
        max_students: c.max_students,
        enrollments: c.class_enrollments || [],
      }));
      
      setClasses(formattedClasses);

      // Buscar frequência recente das turmas do instrutor
      const classIds = formattedClasses.map(c => c.id);
      
      if (classIds.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(`
            checked_in_at,
            student_id,
            class_id
          `)
          .in("class_id", classIds)
          .gte("checked_in_at", sevenDaysAgo.toISOString())
          .order("checked_in_at", { ascending: false })
          .limit(10);

        if (attendanceError) throw attendanceError;

        // Fetch student and class names separately
        const enrichedAttendance = await Promise.all(
          (attendanceData || []).map(async (record) => {
            const [studentResult, classResult] = await Promise.all([
              supabase.from("students").select("full_name").eq("id", record.student_id).single(),
              supabase.from("classes").select("name").eq("id", record.class_id).single(),
            ]);

            return {
              checked_in_at: record.checked_in_at,
              students: studentResult.data,
              classes: classResult.data,
            };
          })
        );

        setRecentAttendance(enrichedAttendance);

      }
    } catch (error: any) {
      console.error("Error fetching instructor data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  const totalStudents = classes.reduce((sum, c) => sum + c.enrollments.length, 0);
  const totalCheckIns = recentAttendance.length;

  return (
    <div className="space-y-6 md:space-y-8">
      <TutorialManager userRole="instructor" />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard do Instrutor</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie suas turmas e acompanhe a frequência</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/instructor-profile")}
          className="flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Meu Perfil
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" data-tutorial="stats">
        <Card className="p-6 hover:border-primary transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Turmas Ativas</p>
              <h3 className="text-3xl font-bold">{classes.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:border-primary transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alunos Matriculados</p>
              <h3 className="text-3xl font-bold">{totalStudents}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:border-primary transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Check-ins (7 dias)</p>
              <h3 className="text-3xl font-bold">{totalCheckIns}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Minhas Turmas */}
      <div data-tutorial="instructor-classes">
        <h2 className="text-2xl font-semibold mb-4">Minhas Turmas</h2>
        {classes.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma turma atribuída</h3>
            <p className="text-muted-foreground">
              Aguarde o administrador atribuir turmas para você
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="p-6">
                <h3 className="font-semibold text-lg mb-2">{classItem.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  📅 {classItem.schedule}
                </p>
                <p className="text-sm text-muted-foreground">
                  👥 {classItem.enrollments.length}/{classItem.max_students} alunos
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Frequência Recente */}
      {recentAttendance.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Frequência Recente (últimos 7 dias)</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Aluno</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Turma</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentAttendance.map((record, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {record.students?.full_name || "Desconhecido"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.classes?.name || "Desconhecida"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(record.checked_in_at).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
