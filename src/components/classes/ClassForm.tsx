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
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  schedules?: ScheduleItem[];
}

interface ScheduleItem {
  id?: string;
  name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
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
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { name: "", days_of_week: [], start_time: "", end_time: "" }
  ]);
  
  const daysOfWeek = [
    { value: "segunda", label: "Seg" },
    { value: "terça", label: "Ter" },
    { value: "quarta", label: "Qua" },
    { value: "quinta", label: "Qui" },
    { value: "sexta", label: "Sex" },
    { value: "sábado", label: "Sáb" },
    { value: "domingo", label: "Dom" },
  ];

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
    // Validar horários
    if (schedules.length === 0 || schedules.some(s => !s.name || s.days_of_week.length === 0 || !s.start_time || !s.end_time)) {
      toast.error("Preencha todos os horários corretamente");
      return;
    }
    
    // Adicionar horários ao data
    data.schedules = schedules;
    // Criar um resumo dos horários para o campo schedule
    data.schedule = schedules.map(s => 
      `${s.name} (${s.days_of_week.join(", ")} ${s.start_time}-${s.end_time})`
    ).join("; ");
    
    await onSubmit(data);
    reset();
    setSchedules([{ name: "", days_of_week: [], start_time: "", end_time: "" }]);
    onOpenChange(false);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { name: "", days_of_week: [], start_time: "", end_time: "" }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const updateSchedule = (index: number, field: keyof ScheduleItem, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const toggleDay = (scheduleIndex: number, day: string) => {
    const schedule = schedules[scheduleIndex];
    const newDays = schedule.days_of_week.includes(day)
      ? schedule.days_of_week.filter(d => d !== day)
      : [...schedule.days_of_week, day];
    updateSchedule(scheduleIndex, "days_of_week", newDays);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Turma" : "Nova Turma"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações da turma" : "Adicione uma nova turma com seus horários"}
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Horários das Aulas *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Horário
              </Button>
            </div>

            {schedules.map((schedule, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Horário {index + 1}</h4>
                  {schedules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSchedule(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor={`schedule-name-${index}`}>Nome do Horário</Label>
                  <Input
                    id={`schedule-name-${index}`}
                    value={schedule.name}
                    onChange={(e) => updateSchedule(index, "name", e.target.value)}
                    placeholder="Ex: Manhã, Tarde, Noite"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Dias da Semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <div key={day.value} className="flex items-center space-x-1">
                        <Checkbox
                          id={`day-${index}-${day.value}`}
                          checked={schedule.days_of_week.includes(day.value)}
                          onCheckedChange={() => toggleDay(index, day.value)}
                        />
                        <label
                          htmlFor={`day-${index}-${day.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`start-time-${index}`}>Horário Início</Label>
                    <Input
                      id={`start-time-${index}`}
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) => updateSchedule(index, "start_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`end-time-${index}`}>Horário Fim</Label>
                    <Input
                      id={`end-time-${index}`}
                      type="time"
                      value={schedule.end_time}
                      onChange={(e) => updateSchedule(index, "end_time", e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            ))}
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
