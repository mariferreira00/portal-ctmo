import React, { useEffect } from "react";
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

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  defaultValues?: Partial<StudentFormData>;
  isEditing?: boolean;
  userEmail?: string;
  isOwnProfile?: boolean;
}

export interface StudentFormData {
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  monthly_fee: number;
  payment_due_day?: number;
  active?: boolean;
  user_id?: string;
}

export function StudentForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
  userEmail,
  isOwnProfile = false,
}: StudentFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    defaultValues: {
      ...defaultValues,
      email: userEmail || defaultValues?.email,
      active: defaultValues?.active ?? true,
      monthly_fee: defaultValues?.monthly_fee ?? 90.00,
    },
  });

  // Reset form when defaultValues or open state changes
  useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        email: userEmail || defaultValues?.email,
        active: defaultValues?.active ?? true,
        monthly_fee: defaultValues?.monthly_fee ?? 90.00,
      });
    }
  }, [open, defaultValues, userEmail, reset]);

  const handleFormSubmit = async (data: StudentFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  const isPaymentDayDisabled = isOwnProfile && defaultValues?.payment_due_day !== null && defaultValues?.payment_due_day !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Aluno" : "Novo Aluno"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do aluno" : "Adicione um novo aluno ao sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              {...register("full_name", { required: "Nome é obrigatório" })}
              placeholder="Nome do aluno"
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
              placeholder="aluno@email.com"
              disabled={isOwnProfile}
              className={isOwnProfile ? "bg-muted" : ""}
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
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              {...register("birth_date")}
            />
          </div>

          {!isOwnProfile && (
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">Valor Mensalidade (R$) *</Label>
              <Input
                id="monthly_fee"
                type="number"
                step="0.01"
                {...register("monthly_fee", { 
                  required: "Valor da mensalidade é obrigatório",
                  valueAsNumber: true,
                  min: { value: 0, message: "Valor deve ser positivo" }
                })}
                placeholder="90.00"
              />
              {errors.monthly_fee && (
                <p className="text-sm text-destructive">{errors.monthly_fee.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment_due_day">Dia de Vencimento (1-31)</Label>
            <Input
              id="payment_due_day"
              type="number"
              min="1"
              max="31"
              {...register("payment_due_day", { 
                valueAsNumber: true,
                min: { value: 1, message: "Dia deve ser entre 1 e 31" },
                max: { value: 31, message: "Dia deve ser entre 1 e 31" }
              })}
              placeholder="10"
              disabled={isPaymentDayDisabled}
              className={isPaymentDayDisabled ? "bg-muted" : ""}
            />
            {errors.payment_due_day && (
              <p className="text-sm text-destructive">{errors.payment_due_day.message}</p>
            )}
            {isPaymentDayDisabled && (
              <p className="text-xs text-muted-foreground">Para alterar o dia de vencimento, entre em contato com o administrador</p>
            )}
            {isOwnProfile && !isPaymentDayDisabled && (
              <p className="text-xs text-muted-foreground">Você pode definir o dia de vencimento apenas uma vez</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Contato de Emergência</Label>
            <Input
              id="emergency_contact"
              {...register("emergency_contact")}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
            <Input
              id="emergency_phone"
              {...register("emergency_phone")}
              placeholder="(00) 00000-0000"
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
