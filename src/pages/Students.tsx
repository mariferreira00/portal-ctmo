import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StudentForm, StudentFormData } from "@/components/students/StudentForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";


const Students = () => {
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [hasOwnProfile, setHasOwnProfile] = useState(false);

  useEffect(() => {
    fetchStudents();
    checkOwnProfile();
  }, [user]);

  async function checkOwnProfile() {
    if (!user || isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setHasOwnProfile(!!data);
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    }
  }

  async function fetchStudents() {
    try {
      const { data, error } = await supabase.from("students").select("*").order("full_name");
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: StudentFormData) {
    try {
      const payload = { ...data };
      
      // Se não for admin, adiciona o user_id do usuário logado
      if (!isAdmin && user) {
        payload.user_id = user.id;
      }
      
      if (editingStudent) {
        const { error } = await supabase.from("students").update(payload).eq("id", editingStudent.id);
        if (error) throw error;
        toast.success("Aluno atualizado!");
      } else {
        const { error } = await supabase.from("students").insert([payload]);
        if (error) throw error;
        toast.success("Aluno cadastrado!");
        setHasOwnProfile(true);
      }
      fetchStudents();
      setEditingStudent(null);
      checkOwnProfile();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir?")) return;
    try {
      await supabase.from("students").delete().eq("id", id);
      toast.success("Excluído!");
      fetchStudents();
    } catch (error: any) {
      toast.error("Erro ao excluir");
    }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Alunos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie os alunos matriculados</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => { setEditingStudent(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />Novo Aluno
          </Button>
        ) : !hasOwnProfile && (
          <Button onClick={() => { setEditingStudent(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />Criar Meu Perfil
          </Button>
        )}
      </div>

      {students.length === 0 ? (
        <Card className="p-6 md:p-8 bg-card border-border text-center">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 md:py-12">
            <div className="p-4 bg-primary/10 rounded-full"><UserPlus className="w-12 h-12 text-primary" /></div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-muted-foreground mb-6">
                {isAdmin ? "Adicione os alunos para começar a gerenciar matrículas" : "Nenhum aluno cadastrado ainda"}
              </p>
              {isAdmin && (
                <Button onClick={() => setFormOpen(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Cadastrar Primeiro Aluno</Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <Card key={s.id} className="p-6 bg-card border-border">
              <h3 className="font-semibold text-foreground">{s.full_name}</h3>
              <p className="text-sm text-muted-foreground">{s.email}</p>
              <p className="text-sm font-medium text-primary mt-2">R$ {Number(s.monthly_fee || 0).toFixed(2)}/mês</p>
              {s.payment_due_day && (
                <p className="text-xs text-muted-foreground mt-1">Vencimento: dia {s.payment_due_day}</p>
              )}
              {isAdmin && (
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => { setEditingStudent(s); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <StudentForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleSubmit} 
        defaultValues={editingStudent} 
        isEditing={!!editingStudent}
        userEmail={!isAdmin ? user?.email : undefined}
        isOwnProfile={!isAdmin && !editingStudent}
      />
    </div>
  );
};

export default Students;
