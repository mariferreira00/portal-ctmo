import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Users, Clock, Target, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { WeeklyProgress } from "@/components/attendance/WeeklyProgress";
import { StudentForm, StudentFormData } from "@/components/students/StudentForm";
import { AchievementNotification } from "@/components/achievements/AchievementNotification";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  user_id: string;
  payment_due_day: number | null;
  weekly_goal: number;
}

interface ClassEnrollment {
  class_id: string;
  classes: {
    id: string;
    name: string;
    schedule: string;
    teachers: {
      full_name: string;
    } | null;
  };
}

interface TodayAttendance {
  class_id: string;
  checked_in_at: string;
}

interface NewAchievement {
  name: string;
  description: string;
  points: number;
  rarity: string;
}

const StudentPortal = () => {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance[]>([]);
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<Array<{ checked_in_at: string; class_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [newAchievement, setNewAchievement] = useState<NewAchievement | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(3);

  useEffect(() => {
    if (user) {
      fetchStudentProfile();
    }
  }, [user]);

  useEffect(() => {
    if (studentProfile) {
      fetchEnrollments();
      fetchAvailableClasses();
      fetchTodayAttendance();
      fetchWeeklyCheckIns();
    }
  }, [studentProfile]);

  async function fetchStudentProfile() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStudentProfile(data);
        setTempGoal(data.weekly_goal);
      } else {
        setSetupMode(true);
      }
    } catch (error: any) {
      console.error("Error fetching student profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProfile(data: StudentFormData) {
    try {
      const { data: newStudent, error } = await supabase
        .from("students")
        .insert([{
          user_id: user?.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          birth_date: data.birth_date || null,
          emergency_contact: data.emergency_contact || null,
          emergency_phone: data.emergency_phone || null,
          monthly_fee: data.monthly_fee,
          payment_due_day: data.payment_due_day || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setStudentProfile(newStudent);
      setSetupMode(false);
      toast.success("Perfil criado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao criar perfil");
      console.error(error);
    }
  }

  async function fetchEnrollments() {
    try {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          class_id,
          classes (
            id,
            name,
            schedule,
            is_free,
            teachers (
              full_name
            )
          )
        `)
        .eq("student_id", studentProfile?.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
    }
  }

  async function fetchAvailableClasses() {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          teachers (
            full_name
          )
        `)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setAvailableClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
    }
  }

  async function fetchTodayAttendance() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("attendance")
        .select("class_id, checked_in_at")
        .eq("student_id", studentProfile?.id)
        .gte("checked_in_at", today);

      if (error) throw error;
      setTodayAttendance(data || []);
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
    }
  }

  async function fetchWeeklyCheckIns() {
    if (!studentProfile) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          checked_in_at,
          class:classes(name)
        `)
        .eq("student_id", studentProfile.id)
        .gte("checked_in_at", sevenDaysAgo.toISOString())
        .order("checked_in_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        checked_in_at: item.checked_in_at,
        class_name: item.class?.name || "Desconhecido",
      }));

      setWeeklyCheckIns(formattedData);
    } catch (error: any) {
      console.error("Error fetching weekly check-ins:", error);
    }
  }

  async function handleEnroll(classId: string, isFree: boolean) {
    if (!studentProfile) return;

    // Check if student already has a regular enrollment
    const hasRegularEnrollment = enrollments.some(
      e => e.classes && !(e.classes as any).is_free
    );

    // If student has a regular enrollment and this class is not free, prevent enrollment
    if (hasRegularEnrollment && !isFree) {
      toast.error("Você já está matriculado em uma turma regular. Para matrículas adicionais, solicite na recepção.");
      return;
    }

    try {
      const { error } = await supabase
        .from("class_enrollments")
        .insert([{
          student_id: studentProfile.id,
          class_id: classId,
        }]);

      if (error) throw error;

      toast.success("Matrícula realizada com sucesso!");
      fetchEnrollments();
      fetchAvailableClasses();
    } catch (error: any) {
      toast.error("Erro ao matricular");
      console.error(error);
    }
  }

  async function handleRequestEnrollment(classId: string, className: string) {
    if (!studentProfile) return;

    try {
      const { error } = await supabase
        .from("enrollment_requests")
        .insert([{
          student_id: studentProfile.id,
          class_id: classId,
          message: `Solicitação de matrícula adicional na turma ${className}`,
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error("Você já tem uma solicitação pendente para esta turma");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Solicitação enviada! A administração entrará em contato em breve.");
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação");
      console.error(error);
    }
  }

  async function handleCheckIn(classId: string) {
    try {
      const { error } = await supabase
        .from("attendance")
        .insert([{
          student_id: studentProfile?.id,
          class_id: classId,
        }]);

      if (error) throw error;

      toast.success("Check-in realizado com sucesso!");
      fetchTodayAttendance();
      fetchWeeklyCheckIns();
      
      // Check for new achievements
      await checkForNewAchievements();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("Você já fez check-in nesta turma hoje!");
      } else {
        toast.error("Erro ao fazer check-in");
      }
      console.error(error);
    }
  }

  async function checkForNewAchievements() {
    if (!studentProfile) return;

    try {
      // Get achievements that were just completed
      const { data: recentAchievements, error } = await supabase
        .from("user_achievements")
        .select("completed, unlocked_at, achievement_id")
        .eq("student_id", studentProfile.id)
        .eq("completed", true)
        .order("unlocked_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (recentAchievements && recentAchievements.length > 0) {
        const userAchievement = recentAchievements[0];
        const unlockedAt = new Date(userAchievement.unlocked_at);
        const now = new Date();
        
        // Only show notification if unlocked in the last 10 seconds
        if (now.getTime() - unlockedAt.getTime() < 10000) {
          // Fetch achievement details
          const { data: achievementData, error: achievementError } = await supabase
            .from("achievements")
            .select("name, description, points, rarity")
            .eq("id", userAchievement.achievement_id)
            .single();

          if (achievementError) throw achievementError;

          if (achievementData) {
            setNewAchievement({
              name: achievementData.name,
              description: achievementData.description,
              points: achievementData.points,
              rarity: achievementData.rarity,
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error checking achievements:", error);
    }
  }

  function hasCheckedInToday(classId: string) {
    return todayAttendance.some(a => a.class_id === classId);
  }

  function isEnrolled(classId: string) {
    return enrollments.some(e => e.class_id === classId);
  }

  async function handleUpdateGoal() {
    if (!studentProfile) return;
    
    if (tempGoal < 1 || tempGoal > 7) {
      toast.error("A meta deve ser entre 1 e 7 treinos");
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({ weekly_goal: tempGoal })
        .eq("id", studentProfile.id);

      if (error) throw error;

      setStudentProfile({ ...studentProfile, weekly_goal: tempGoal });
      setEditingGoal(false);
      toast.success("Meta semanal atualizada!");
    } catch (error: any) {
      toast.error("Erro ao atualizar meta");
      console.error(error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (setupMode) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <StudentForm
          open={setupMode}
          onOpenChange={setSetupMode}
          onSubmit={handleCreateProfile}
          userEmail={user?.email}
          isOwnProfile={true}
        />
      </div>
    );
  }

  const enrolledClassIds = enrollments.map(e => e.class_id);
  const unenrolledClasses = availableClasses.filter(c => !enrolledClassIds.includes(c.id));
  
  // Check if student has a regular (non-free) enrollment
  const hasRegularEnrollment = enrollments.some(
    e => e.classes && !(e.classes as any).is_free
  );

  // Calculate next payment due date
  const getNextPaymentDate = () => {
    if (!studentProfile?.payment_due_day) return null;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dueDay = studentProfile.payment_due_day;
    
    let nextPaymentDate = new Date(currentYear, currentMonth, dueDay);
    
    // If the due date has passed this month, move to next month
    if (nextPaymentDate < today) {
      nextPaymentDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    return nextPaymentDate;
  };

  const nextPaymentDate = getNextPaymentDate();

  return (
    <div className="space-y-6 md:space-y-8">
      {newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
      
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Portal do Aluno</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Bem-vindo, {studentProfile?.full_name}
        </p>
      </div>

      {/* Next Payment Due */}
      {nextPaymentDate && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Próxima mensalidade em:</p>
              <p className="text-2xl font-bold">
                {nextPaymentDate.toLocaleDateString("pt-BR", { 
                  day: "2-digit", 
                  month: "long", 
                  year: "numeric" 
                })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Goal Configuration */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Meta Semanal</h3>
          </div>
          {!editingGoal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingGoal(true)}
            >
              Editar
            </Button>
          )}
        </div>

        {editingGoal ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="weekly-goal">Quantos treinos você pretende fazer por semana?</Label>
              <Input
                id="weekly-goal"
                type="number"
                min="1"
                max="7"
                value={tempGoal}
                onChange={(e) => setTempGoal(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Defina sua meta entre 1 e 7 treinos por semana
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateGoal} size="sm">
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempGoal(studentProfile?.weekly_goal || 3);
                  setEditingGoal(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Sua meta atual: <span className="font-semibold text-foreground">{studentProfile?.weekly_goal || 3} treinos por semana</span>
          </p>
        )}
      </Card>

      {/* Weekly Progress */}
      <WeeklyProgress 
        checkIns={weeklyCheckIns} 
        weeklyGoal={studentProfile?.weekly_goal || 3}
      />

      {/* Minhas Turmas */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Minhas Turmas
        </h2>
        
        {enrollments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma turma matriculada</h3>
            <p className="text-muted-foreground">
              Matricule-se em uma turma abaixo para começar
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => {
              const classData = enrollment.classes;
              const checkedIn = hasCheckedInToday(classData.id);
              
              return (
                <Card key={classData.id} className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{classData.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    👨‍🏫 {classData.teachers?.full_name || "Sem professor"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    📅 {classData.schedule}
                  </p>

                  <Button
                    onClick={() => handleCheckIn(classData.id)}
                    disabled={checkedIn}
                    className="w-full"
                    variant={checkedIn ? "outline" : "default"}
                  >
                    {checkedIn ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Check-in Feito
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Fazer Check-in
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Turmas Disponíveis */}
      {unenrolledClasses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Turmas Disponíveis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unenrolledClasses.map((classItem) => {
              const isFree = classItem.is_free;
              const canEnroll = !hasRegularEnrollment || isFree;

              return (
                <Card key={classItem.id} className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{classItem.name}</h3>
                    {isFree && (
                      <Badge variant="secondary" className="text-xs">
                        Livre
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    👨‍🏫 {classItem.teachers?.full_name || "Sem professor"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    📅 {classItem.schedule}
                  </p>

                  {canEnroll ? (
                    <Button
                      onClick={() => handleEnroll(classItem.id, isFree)}
                      variant="outline"
                      className="w-full"
                    >
                      Matricular-se
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleRequestEnrollment(classItem.id, classItem.name)}
                      variant="outline"
                      className="w-full"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Solicitar Matrícula
                    </Button>
                  )}
                  {!canEnroll && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Matrícula adicional requer aprovação
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
