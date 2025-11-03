import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

interface SubclassManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: any;
  onUpdate: () => void;
}

interface Subclass {
  id: string;
  name: string;
  schedule: string;
  active: boolean;
}

export const SubclassManager = ({ open, onOpenChange, classItem, onUpdate }: SubclassManagerProps) => {
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubclass, setEditingSubclass] = useState<Subclass | null>(null);
  const [formData, setFormData] = useState({ name: "", schedule: "" });

  useEffect(() => {
    if (open && classItem) {
      fetchSubclasses();
    }
  }, [open, classItem]);

  async function fetchSubclasses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subclasses")
        .select("*")
        .eq("class_id", classItem.id)
        .order("name");

      if (error) throw error;
      setSubclasses(data || []);
    } catch (error: any) {
      console.error("Error fetching subclasses:", error);
      toast.error("Erro ao carregar subturmas");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingSubclass) {
        const { error } = await supabase
          .from("subclasses")
          .update({ name: formData.name, schedule: formData.schedule })
          .eq("id", editingSubclass.id);

        if (error) throw error;
        toast.success("Subturma atualizada!");
      } else {
        const { error } = await supabase
          .from("subclasses")
          .insert([{ 
            class_id: classItem.id, 
            name: formData.name, 
            schedule: formData.schedule 
          }]);

        if (error) throw error;
        toast.success("Subturma criada!");
      }

      setFormData({ name: "", schedule: "" });
      setEditingSubclass(null);
      setFormOpen(false);
      fetchSubclasses();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving subclass:", error);
      toast.error("Erro ao salvar subturma");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta subturma? Os check-ins já registrados não serão afetados.")) return;
    
    try {
      const { error } = await supabase
        .from("subclasses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Subturma excluída!");
      fetchSubclasses();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting subclass:", error);
      toast.error("Erro ao excluir subturma");
    }
  }

  function openEditForm(subclass: Subclass) {
    setEditingSubclass(subclass);
    setFormData({ name: subclass.name, schedule: subclass.schedule });
    setFormOpen(true);
  }

  function openCreateForm() {
    setEditingSubclass(null);
    setFormData({ name: "", schedule: "" });
    setFormOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Subturmas - {classItem?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Subturmas permitem agendar múltiplos horários para a mesma turma.
            </p>
            <Button onClick={openCreateForm} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Subturma
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : subclasses.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma subturma cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie subturmas para organizar diferentes horários da turma
              </p>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Subturma
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {subclasses.map((subclass) => (
                <Card key={subclass.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{subclass.name}</h4>
                      <p className="text-sm text-muted-foreground">📅 {subclass.schedule}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditForm(subclass)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(subclass.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Form Dialog */}
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubclass ? "Editar Subturma" : "Nova Subturma"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Subturma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Manhã, Noite, Sábado..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="schedule">Horário</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="Ex: Seg, Qua, Sex - 06:00 às 07:00"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSubclass ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};