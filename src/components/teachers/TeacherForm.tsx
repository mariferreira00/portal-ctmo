import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  defaultValues?: Partial<TeacherFormData>;
  isEditing?: boolean;
}

export interface TeacherFormData {
  full_name: string;
  email: string;
  phone?: string;
  specialties?: string[];
  bio?: string;
}

export function TeacherForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
}: TeacherFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TeacherFormData>({
    defaultValues,
  });

  // Atualiza os valores do formulário quando defaultValues mudar
  React.useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = async (data: TeacherFormData) => {
    const specialtiesArray = data.specialties 
      ? String(data.specialties).split(',').map(s => s.trim()).filter(Boolean)
      : [];
    
    await onSubmit({ ...data, specialties: specialtiesArray });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Professor" : "Novo Professor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do professor" : "Adicione um novo professor ao sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              {...register("full_name", { required: "Nome é obrigatório" })}
              placeholder="Nome do professor"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Email é obrigatório" })}
              placeholder="professor@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
            <Input
              id="specialties"
              {...register("specialties")}
              placeholder="Jiu-Jitsu, Judô, Boxe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Breve descrição sobre o professor"
              rows={4}
            />
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
