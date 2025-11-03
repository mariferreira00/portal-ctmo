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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBrasiliaTime, getTodayStartBrasilia, getCurrentDayOfWeekBrasilia, getCurrentTimeBrasilia } from "@/lib/timezone";

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

interface Subclass {
  id: string;
  name: string;
  schedule: string;
  days_of_week: string[];
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
  const [subclassDialogOpen, setSubclassDialogOpen] = useState(false);
  const [selectedClassForCheckIn, setSelectedClassForCheckIn] = useState<{ id: string; schedule: string } | null>(null);
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);

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
      const todayStart = getTodayStartBrasilia().toISOString();
      const { data, error } = await supabase
        .from("attendance")
        .select("class_id, checked_in_at")
        .eq("student_id", studentProfile?.id)
        .gte("checked_in_at", todayStart);

      if (error) throw error;
      setTodayAttendance(data || []);
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
    }
  }

  async function fetchWeeklyCheckIns() {
    if (!studentProfile) return;

    try {
      const sevenDaysAgo = getBrasiliaTime();
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

  async function handleCheckIn(classId: string, schedule: string) {
    try {
      if (!studentProfile) return;

      // Obter o dia da semana atual
      const currentDay = getCurrentDayOfWeekBrasilia();
      const dayMap: { [key: string]: string } = {
        'segunda-feira': 'segunda',
        'terça-feira': 'terça',
        'quarta-feira': 'quarta',
        'quinta-feira': 'quinta',
        'sexta-feira': 'sexta',
        'sábado': 'sábado',
        'domingo': 'domingo'
      };
      const todayShort = dayMap[currentDay];

      // Buscar horários disponíveis da turma para o dia de hoje
      const { data: subclassData, error: subclassError } = await supabase
        .from("subclasses")
        .select("id, name, schedule, days_of_week")
        .eq("class_id", classId)
        .eq("active", true)
        .order("schedule");

      if (subclassError) throw subclassError;

      // Filtrar apenas os horários do dia de hoje
      const todaySubclasses = subclassData?.filter(sub => 
        sub.days_of_week && sub.days_of_week.includes(todayShort)
      ) || [];

      // Se houver horários para hoje, mostrar seleção
      if (todaySubclasses.length > 0) {
        setSubclasses(todaySubclasses);
        setSelectedClassForCheckIn({ id: classId, schedule });
        setSubclassDialogOpen(true);
      } else if (subclassData && subclassData.length > 0) {
        // Se existem horários mas nenhum para hoje
        toast.error("Não há horários disponíveis para check-in hoje");
      } else {
        // Se não houver horários cadastrados, fazer check-in direto
        await performCheckIn(classId, null);
      }
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast.error("Erro ao fazer check-in. Tente novamente.");
    }
  }

  async function performCheckIn(classId: string, subclassId: string | null) {
    try {
      const insertData: any = {
        student_id: studentProfile?.id,
        class_id: classId,
      };

      if (subclassId) {
        insertData.subclass_id = subclassId;
      }

      const { error } = await supabase
        .from("attendance")
        .insert([insertData]);

      if (error) throw error;

      toast.success("Check-in realizado com sucesso!");
      fetchTodayAttendance();
      fetchWeeklyCheckIns();
      setSubclassDialogOpen(false);
      setSelectedClassForCheckIn(null);
      
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
        const now = getBrasiliaTime();
        
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

  function isCheckInAvailable(schedule: string): { available: boolean; message: string; nextAvailable?: string } {
    const currentDay = getCurrentDayOfWeekBrasilia();
    const { hour: currentHour, minute: currentMinute } = getCurrentTimeBrasilia();
    
    // Extract schedule info (e.g., "Segunda e Quarta, 19h-20h")
    const scheduleText = schedule.toLowerCase();
    
    // Check if today is a training day
    const daysMap: { [key: string]: string } = {
      'segunda-feira': 'segunda',
      'terça-feira': 'terça',
      'quarta-feira': 'quarta',
      'quinta-feira': 'quinta',
      'sexta-feira': 'sexta',
      'sábado': 'sábado',
      'domingo': 'domingo'
    };
    
    const todayShort = daysMap[currentDay];
    if (!todayShort) {
      return { available: false, message: 'Dia inválido' };
    }
    
    const isTodayTrainingDay = scheduleText.includes(todayShort);
    
    if (!isTodayTrainingDay) {
      return {
        available: false,
        message: `Check-in disponível apenas nos dias de treino`,
      };
    }
    
    // Extract start time (e.g., "19h" from "19h-20h")
    const timeMatch = scheduleText.match(/(\d+)h/);
    if (!timeMatch) {
      return { available: true, message: 'Check-in disponível' };
    }
    
    const classStartHour = parseInt(timeMatch[1]);
    
    // Calculate check-in start time (30 minutes before class)
    let checkInStartHour = classStartHour;
    let checkInStartMinute = 30;
    
    // If class starts at the exact hour, check-in starts 30 min before
    if (classStartHour > 0) {
      checkInStartHour = classStartHour - 1;
    } else {
      // Special case: if class is at midnight (00h), check-in starts at 23:30
      checkInStartHour = 23;
    }
    
    // Check if we're in the valid time window (30min before class until 23:59)
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const checkInStartTimeInMinutes = checkInStartHour * 60 + checkInStartMinute;
    const midnightInMinutes = 23 * 60 + 59;
    
    if (currentTimeInMinutes < checkInStartTimeInMinutes) {
      const startTime = `${String(checkInStartHour).padStart(2, '0')}:${String(checkInStartMinute).padStart(2, '0')}`;
      return {
        available: false,
        message: `Check-in abre às ${startTime}`,
        nextAvailable: startTime
      };
    }
    
    if (currentTimeInMinutes > midnightInMinutes) {
      return {
        available: false,
        message: 'Check-in encerrado (até 23:59)',
      };
    }
    
    return { available: true, message: 'Check-in disponível' };
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

  // Calculate default weekly goal based on enrolled classes' schedules
  const calculateDefaultWeeklyGoal = () => {
    const daysOfWeek = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
    const uniqueDays = new Set<string>();

    enrollments.forEach(enrollment => {
      const schedule = enrollment.classes?.schedule?.toLowerCase() || '';
      daysOfWeek.forEach(day => {
        if (schedule.includes(day)) {
          uniqueDays.add(day);
        }
      });
    });

    return uniqueDays.size || 3; // Default to 3 if no classes enrolled
  };

  const defaultWeeklyGoal = calculateDefaultWeeklyGoal();
  const currentWeeklyGoal = studentProfile?.weekly_goal || defaultWeeklyGoal;

  // Calculate next payment due date
  const getNextPaymentDate = () => {
    if (!studentProfile?.payment_due_day) return null;
    
    const today = getBrasiliaTime();
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
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTempGoal(1);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setTempGoal(numValue);
                    }
                  }
                }}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Meta sugerida baseada nas suas turmas: {defaultWeeklyGoal} treinos
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
                  setTempGoal(studentProfile?.weekly_goal || defaultWeeklyGoal);
                  setEditingGoal(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Sua meta atual: <span className="font-semibold text-foreground">{currentWeeklyGoal} treinos por semana</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Meta sugerida pelas suas turmas: {defaultWeeklyGoal} treinos
            </p>
          </div>
        )}
      </Card>

      {/* Weekly Progress */}
      <WeeklyProgress 
        checkIns={weeklyCheckIns} 
        weeklyGoal={currentWeeklyGoal}
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
              const checkInStatus = isCheckInAvailable(classData.schedule);
              
              return (
                <Card key={classData.id} className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{classData.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    👨‍🏫 {classData.teachers?.full_name || "Sem professor"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    📅 {classData.schedule}
                  </p>

                  {!checkedIn && !checkInStatus.available && (
                    <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {checkInStatus.message}
                    </p>
                  )}

                  <Button
                    onClick={() => handleCheckIn(classData.id, classData.schedule)}
                    disabled={checkedIn || !checkInStatus.available}
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

      {/* Dialog de Seleção de Horário */}
      <Dialog open={subclassDialogOpen} onOpenChange={setSubclassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione o horário do seu treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escolha qual horário você está fazendo check-in hoje:
            </p>
            {subclasses.map((subclass) => (
              <Button
                key={subclass.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 hover:bg-accent"
                onClick={() => {
                  if (selectedClassForCheckIn) {
                    performCheckIn(selectedClassForCheckIn.id, subclass.id);
                  }
                }}
              >
                <div className="w-full">
                  <div className="font-semibold mb-1">{subclass.name}</div>
                  <div className="text-sm text-muted-foreground">{subclass.schedule}</div>
                </div>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => {
                setSubclassDialogOpen(false);
                setSelectedClassForCheckIn(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPortal;
