import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TeacherForm, TeacherFormData } from "@/components/teachers/TeacherForm";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Teachers = () => {
  const { user } = useAuth();
  const { isAdmin, isInstructor } = useUserRole();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar professores");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: TeacherFormData) {
    try {
      if (editingTeacher) {
        const { error } = await supabase
          .from("teachers")
          .update(data)
          .eq("id", editingTeacher.id);

        if (error) throw error;
        toast.success("Professor atualizado com sucesso!");
      } else {
        // Se for instrutor criando seu próprio perfil, vincula o user_id
        const insertData = isInstructor && !isAdmin 
          ? { ...data, user_id: user?.id }
          : data;

        const { error } = await supabase
          .from("teachers")
          .insert([insertData]);

        if (error) throw error;
        toast.success("Professor cadastrado com sucesso!");
      }

      fetchTeachers();
      setEditingTeacher(null);
      setFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar professor");
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir este professor?")) return;

    try {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Professor excluído com sucesso!");
      fetchTeachers();
    } catch (error: any) {
      toast.error("Erro ao excluir professor");
      console.error(error);
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Professores
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie os instrutores do Portal CTMO
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTeacher(null);
            setFormOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Professor
        </Button>
      </div>

      {teachers.length === 0 ? (
        <Card className="p-6 md:p-8 bg-card border-border text-center">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 md:py-12">
            <div className="p-4 bg-primary/10 rounded-full">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum professor cadastrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Comece adicionando os instrutores do centro de treinamento
              </p>
              <Button
                onClick={() => setFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Professor
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="p-6 bg-card border-border">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {teacher.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {teacher.email}
                      </p>
                    </div>
                  </div>
                </div>

                {teacher.phone && (
                  <p className="text-sm text-muted-foreground">
                    📞 {teacher.phone}
                  </p>
                )}

                {teacher.specialties && teacher.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {teacher.specialties.map((specialty: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {teacher.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {teacher.bio}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(teacher.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TeacherForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        defaultValues={editingTeacher ? {
          full_name: editingTeacher.full_name,
          email: editingTeacher.email,
          phone: editingTeacher.phone,
          specialties: editingTeacher.specialties?.join(", "),
          bio: editingTeacher.bio,
        } : undefined}
        isEditing={!!editingTeacher}
      />
    </div>
  );
};

export default Teachers;
