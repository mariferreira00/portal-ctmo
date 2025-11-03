import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  days_of_week: string[];
}

export const SubclassManager = ({ open, onOpenChange, classItem, onUpdate }: SubclassManagerProps) => {
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubclass, setEditingSubclass] = useState<Subclass | null>(null);
  const [formData, setFormData] = useState({ name: "", schedule: "", days_of_week: [] as string[] });

  const daysOfWeek = [
    { value: "segunda", label: "Segunda" },
    { value: "terça", label: "Terça" },
    { value: "quarta", label: "Quarta" },
    { value: "quinta", label: "Quinta" },
    { value: "sexta", label: "Sexta" },
    { value: "sábado", label: "Sábado" },
    { value: "domingo", label: "Domingo" },
  ];

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
      toast.error("Erro ao carregar horários");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.days_of_week.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    try {
      if (editingSubclass) {
        const { error } = await supabase
          .from("subclasses")
          .update({ 
            name: formData.name, 
            schedule: formData.schedule,
            days_of_week: formData.days_of_week 
          })
          .eq("id", editingSubclass.id);

        if (error) throw error;
        toast.success("Horário atualizado!");
      } else {
        const { error } = await supabase
          .from("subclasses")
          .insert([{ 
            class_id: classItem.id, 
            name: formData.name, 
            schedule: formData.schedule,
            days_of_week: formData.days_of_week
          }]);

        if (error) throw error;
        toast.success("Horário criado!");
      }

      setFormData({ name: "", schedule: "", days_of_week: [] });
      setEditingSubclass(null);
      setFormOpen(false);
      fetchSubclasses();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving subclass:", error);
      toast.error("Erro ao salvar horário");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este horário? Os check-ins já registrados não serão afetados.")) return;
    
    try {
      const { error } = await supabase
        .from("subclasses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Horário excluído!");
      fetchSubclasses();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting subclass:", error);
      toast.error("Erro ao excluir horário");
    }
  }

  function openEditForm(subclass: Subclass) {
    setEditingSubclass(subclass);
    setFormData({ 
      name: subclass.name, 
      schedule: subclass.schedule,
      days_of_week: subclass.days_of_week || []
    });
    setFormOpen(true);
  }

  function openCreateForm() {
    setEditingSubclass(null);
    setFormData({ name: "", schedule: "", days_of_week: [] });
    setFormOpen(true);
  }

  function toggleDay(day: string) {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Horários - {classItem?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure os diferentes horários disponíveis para check-in dos alunos
            </p>
            <Button onClick={openCreateForm} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Horário
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : subclasses.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum horário cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre os horários disponíveis para que os alunos possam escolher na hora do check-in
              </p>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Horário
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {subclasses.map((subclass) => (
                <Card key={subclass.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{subclass.name}</h4>
                      <p className="text-sm text-muted-foreground">⏰ {subclass.schedule}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 {subclass.days_of_week?.join(", ") || "Nenhum dia selecionado"}
                      </p>
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
                {editingSubclass ? "Editar Horário" : "Novo Horário"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Horário</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Manhã, Tarde, Noite"
                  required
                />
              </div>
              <div>
                <Label htmlFor="schedule">Horário da Aula</Label>
                <Input
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="Ex: 06:00 às 07:00"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label>Dias da Semana</Label>
                <div className="grid grid-cols-2 gap-3">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={formData.days_of_week.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label
                        htmlFor={day.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.days_of_week.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selecione os dias em que esta aula ocorre
                  </p>
                )}
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