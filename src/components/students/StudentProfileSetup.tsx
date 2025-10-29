import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle } from "lucide-react";

interface StudentProfileSetupProps {
  onComplete: () => void;
}

export function StudentProfileSetup({ onComplete }: StudentProfileSetupProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: user?.email || "",
    phone: "",
    birth_date: "",
    emergency_contact: "",
    emergency_phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("students").insert([
        {
          user_id: user?.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          emergency_contact: formData.emergency_contact || null,
          emergency_phone: formData.emergency_phone || null,
          monthly_fee: 90.00, // Valor padrão
        },
      ]);

      if (error) throw error;

      toast.success("Perfil de aluno criado com sucesso!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar perfil de aluno");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Complete seu Perfil de Aluno
          </h1>
          <p className="text-muted-foreground">
            Preencha suas informações para começar a usar o portal do aluno
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Contato de Emergência</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) =>
                setFormData({ ...formData, emergency_contact: e.target.value })
              }
              placeholder="Nome do contato de emergência"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
            <Input
              id="emergency_phone"
              value={formData.emergency_phone}
              onChange={(e) =>
                setFormData({ ...formData, emergency_phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formData.full_name || !formData.email}
          >
            {isSubmitting ? "Salvando..." : "Completar Perfil"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
