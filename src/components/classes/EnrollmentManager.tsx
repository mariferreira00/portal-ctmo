import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EnrollmentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: any;
  onUpdate: () => void;
}

export function EnrollmentManager({ open, onOpenChange, classItem, onUpdate }: EnrollmentManagerProps) {
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && classItem) {
      fetchData();
    }
  }, [open, classItem]);

  async function fetchData() {
    setLoading(true);
    try {
      // Buscar todos os alunos
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("active", true)
        .order("full_name");
      
      if (studentsError) throw studentsError;

      // Buscar matrículas da turma
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("class_enrollments")
        .select("*, students(*)")
        .eq("class_id", classItem.id);
      
      if (enrollmentsError) throw enrollmentsError;

      setAllStudents(students || []);
      setEnrolledStudents(enrollments || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(studentId: string) {
    try {
      const { error } = await supabase
        .from("class_enrollments")
        .insert([{ class_id: classItem.id, student_id: studentId }]);
      
      if (error) throw error;
      
      toast.success("Aluno matriculado!");
      fetchData();
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao matricular aluno");
    }
  }

  async function handleUnenroll(enrollmentId: string) {
    try {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);
      
      if (error) throw error;
      
      toast.success("Aluno removido!");
      fetchData();
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao remover aluno");
    }
  }

  const enrolledStudentIds = enrolledStudents.map(e => e.student_id);
  const availableStudents = allStudents.filter(s => !enrolledStudentIds.includes(s.id));

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="p-8 text-center">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Matrículas - {classItem?.name}</DialogTitle>
          <DialogDescription>
            Adicione ou remova alunos desta turma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alunos matriculados */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Alunos Matriculados
              <Badge variant="secondary">{enrolledStudents.length}</Badge>
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {enrolledStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum aluno matriculado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {enrolledStudents.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{enrollment.students?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {Number(enrollment.students?.monthly_fee || 0).toFixed(2)}/mês
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnenroll(enrollment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Alunos disponíveis */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Alunos Disponíveis
              <Badge variant="secondary">{availableStudents.length}</Badge>
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {availableStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Todos os alunos ativos já estão matriculados
                </p>
              ) : (
                <div className="space-y-2">
                  {availableStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {Number(student.monthly_fee || 0).toFixed(2)}/mês
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnroll(student.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Matricular
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
