import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClassFormData) => Promise<void>;
  defaultValues?: Partial<ClassFormData>;
  isEditing?: boolean;
  isInstructor?: boolean;
}

export interface ClassFormData {
  name: string;
  teacher_id?: string;
  schedule: string;
  max_students: number;
  active?: boolean;
  is_free?: boolean;
}

export function ClassForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
  isInstructor = false,
}: ClassFormProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isFree, setIsFree] = useState(defaultValues?.is_free ?? false);
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ClassFormData>({
    defaultValues: {
      ...defaultValues,
      active: defaultValues?.active ?? true,
      max_students: defaultValues?.max_students ?? 20,
      is_free: defaultValues?.is_free ?? false,
    },
  });

  useEffect(() => {
    async function fetchTeachers() {
      const { data } = await supabase
        .from("teachers")
        .select("id, full_name")
        .order("full_name");
      
      if (data) setTeachers(data);
    }
    
    if (open) fetchTeachers();
  }, [open]);

  const handleFormSubmit = async (data: ClassFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Turma" : "Nova Turma"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações da turma" : "Adicione uma nova turma ao sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Turma *</Label>
            <Input
              id="name"
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Ex: Jiu-Jitsu Infantil"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {!isInstructor && (
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Professor</Label>
              <Select
                onValueChange={(value) => setValue("teacher_id", value)}
                defaultValue={defaultValues?.teacher_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="schedule">Horário *</Label>
            <Input
              id="schedule"
              {...register("schedule", { required: "Horário é obrigatório" })}
              placeholder="Ex: Segunda e Quarta, 18h-19h"
            />
            {errors.schedule && (
              <p className="text-sm text-destructive">{errors.schedule.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_students">Número Máximo de Alunos *</Label>
            <Input
              id="max_students"
              type="number"
              {...register("max_students", { 
                required: "Campo obrigatório",
                min: { value: 1, message: "Mínimo de 1 aluno" }
              })}
              placeholder="20"
            />
            {errors.max_students && (
              <p className="text-sm text-destructive">{errors.max_students.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_free"
              checked={isFree}
              onCheckedChange={(checked) => {
                setIsFree(checked as boolean);
                setValue("is_free", checked as boolean);
              }}
            />
            <Label htmlFor="is_free" className="cursor-pointer">
              Turma Livre (sem cobrança adicional, permite múltiplas matrículas)
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
