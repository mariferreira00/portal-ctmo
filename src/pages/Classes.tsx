import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Pencil, Trash2, DollarSign, UserPlus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClassForm, ClassFormData } from "@/components/classes/ClassForm";
import { EnrollmentManager } from "@/components/classes/EnrollmentManager";
import { SubclassManager } from "@/components/classes/SubclassManager";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Classes = () => {
  const { user } = useAuth();
  const { isAdmin, isInstructor } = useUserRole();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [subclassOpen, setSubclassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  useEffect(() => { 
    if (user !== undefined) {
      fetchClasses(); 
    }
  }, [user, isInstructor, isAdmin]);

  async function fetchClasses() {
    try {
      // Se for instrutor (e não admin), filtrar apenas suas turmas
      if (isInstructor && !isAdmin && user) {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!teacherData) {
          setClasses([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("classes")
          .select(`
            *,
            teachers(full_name),
            subclasses(*)
          `)
          .eq("teacher_id", teacherData.id)
          .order("name");

        if (error) throw error;

        // Buscar enrollments e students separadamente
        const classesWithEnrollments = await Promise.all(
          (data || []).map(async (classItem) => {
            const { data: enrollments } = await supabase
              .from("class_enrollments")
              .select("student_id")
              .eq("class_id", classItem.id);

            const enrichedEnrollments = await Promise.all(
              (enrollments || []).map(async (enrollment) => {
                const { data: student } = await supabase
                  .from("students")
                  .select("monthly_fee")
                  .eq("id", enrollment.student_id)
                  .single();

                return {
                  student_id: enrollment.student_id,
                  students: student,
                };
              })
            );

            return {
              ...classItem,
              class_enrollments: enrichedEnrollments,
            };
          })
        );

        setClasses(classesWithEnrollments);
      } else {
        // Admin - buscar tudo de uma vez
        const { data, error } = await supabase
          .from("classes")
          .select(`
            *,
            teachers(full_name),
            subclasses(*),
            class_enrollments(
              student_id,
              students(monthly_fee)
            )
          `)
          .order("name");

        if (error) throw error;
        setClasses(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast.error("Erro ao carregar turmas: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function formatScheduleFromSubclasses(subclasses: any[]) {
    if (!subclasses || subclasses.length === 0) {
      return "Sem horários cadastrados";
    }

    const dayMap: { [key: string]: string } = {
      'monday': 'segunda',
      'tuesday': 'terça',
      'wednesday': 'quarta',
      'thursday': 'quinta',
      'friday': 'sexta',
      'saturday': 'sábado',
      'sunday': 'domingo'
    };

    return subclasses
      .filter(sub => sub.active)
      .map(sub => {
        const days = sub.days_of_week?.map((day: string) => dayMap[day] || day).join(', ') || '';
        return `${sub.name} (${days} ${sub.schedule})`;
      })
      .join('; ');
  }

  function calculateClassTotal(classItem: any) {
    // Turmas gratuitas não geram custos
    if (classItem.is_free) {
      return 0;
    }
    if (!classItem.class_enrollments || classItem.class_enrollments.length === 0) {
      return 0;
    }
    return classItem.class_enrollments.reduce((total: number, enrollment: any) => {
      return total + (Number(enrollment.students?.monthly_fee) || 0);
    }, 0);
  }

  async function handleSubmit(data: ClassFormData) {
    try {
      // Se for instrutor e não for admin, busca o teacher_id correspondente
      if (isInstructor && !isAdmin && !editingClass) {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("id")
          .eq("user_id", user?.id)
          .maybeSingle();

        if (teacherError) throw teacherError;
        
        if (!teacherData) {
          toast.error("Você precisa ter um perfil de professor cadastrado primeiro.");
          setFormOpen(false);
          return;
        }
        
        data.teacher_id = teacherData.id;
      }

      if (editingClass) {
        await supabase.from("classes").update(data).eq("id", editingClass.id);
        toast.success("Turma atualizada!");
      } else {
        // Criar a turma
        const { data: newClass, error: classError } = await supabase
          .from("classes")
          .insert([{
            name: data.name,
            teacher_id: data.teacher_id,
            schedule: data.schedule,
            max_students: data.max_students,
            active: data.active,
            is_free: data.is_free
          }])
          .select()
          .single();

        if (classError) throw classError;

        // Criar as subturmas (horários) automaticamente
        if (data.schedules && data.schedules.length > 0 && newClass) {
          const subclasses = data.schedules.map(schedule => ({
            class_id: newClass.id,
            name: schedule.name,
            schedule: `${schedule.start_time} às ${schedule.end_time}`,
            days_of_week: schedule.days_of_week,
            active: true
          }));

          const { error: subclassError } = await supabase
            .from("subclasses")
            .insert(subclasses);

          if (subclassError) throw subclassError;
        }

        toast.success("Turma cadastrada com horários!");
      }
      
      fetchClasses();
      setEditingClass(null);
      setFormOpen(false);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir?")) return;
    try {
      await supabase.from("classes").delete().eq("id", id);
      toast.success("Excluída!");
      fetchClasses();
    } catch (error: any) {
      toast.error("Erro");
    }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            {isInstructor && !isAdmin ? "Minhas Turmas" : "Turmas"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isInstructor && !isAdmin ? "Gerencie suas turmas" : "Gerencie as turmas e horários"}
          </p>
        </div>
        <Button onClick={() => { setEditingClass(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Turma
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isInstructor && !isAdmin ? "Você ainda não tem turmas" : "Nenhuma turma cadastrada"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isInstructor && !isAdmin ? "Crie sua primeira turma para começar" : "Comece criando uma turma"}
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Turma
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => {
            const total = calculateClassTotal(c);
            const ctmoShare = total / 2;
            const teacherShare = total / 2;
            
            return (
              <Card key={c.id} className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  {c.name}
                  {c.is_free && <Badge className="ml-2" variant="secondary">Gratuita</Badge>}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">👨‍🏫 {c.teachers?.full_name || "Sem professor"}</p>
                <p className="text-sm text-muted-foreground mb-3">📅 {formatScheduleFromSubclasses(c.subclasses)}</p>
                
                <div className="bg-primary/5 rounded-lg p-3 space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Mensalidades</span>
                  </div>
                  {c.is_free ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground text-center py-2">
                        Turma gratuita - não gera custos
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {c.class_enrollments?.length || 0} aluno(s) matriculado(s)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold">R$ {total.toFixed(2)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">CTMO (50%):</span>
                        <span className="font-medium text-primary">R$ {ctmoShare.toFixed(2)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Professor (50%):</span>
                        <span className="font-medium text-primary">R$ {teacherShare.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {c.class_enrollments?.length || 0} aluno(s) matriculado(s)
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => { 
                      setSelectedClass(c); 
                      setEnrollmentOpen(true); 
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Alunos
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => { 
                      setSelectedClass(c); 
                      setSubclassOpen(true); 
                    }}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Horários
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditingClass(c); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ClassForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleSubmit} 
        defaultValues={editingClass} 
        isEditing={!!editingClass}
        isInstructor={isInstructor && !isAdmin}
      />
      
      {selectedClass && (
        <>
          <EnrollmentManager 
            open={enrollmentOpen} 
            onOpenChange={setEnrollmentOpen}
            classItem={selectedClass}
            onUpdate={fetchClasses}
          />
          <SubclassManager
            open={subclassOpen}
            onOpenChange={setSubclassOpen}
            classItem={selectedClass}
            onUpdate={fetchClasses}
          />
        </>
      )}
    </div>
  );
};

export default Classes;
