import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle } from "lucide-react";

interface InstructorProfileSetupProps {
  onComplete: () => void;
}

export function InstructorProfileSetup({ onComplete }: InstructorProfileSetupProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: user?.email || "",
    phone: "",
    specialties: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Erro: Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);

    try {
      const specialtiesArray = formData.specialties
        ? formData.specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // If a profile already exists (e.g., user got redirected here by mistake), update it instead of failing.
      const { data: existing, error: existingError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload = {
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
        bio: formData.bio || null,
      };

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("teachers")
          .update(payload)
          .eq("id", existing.id);

        if (updateError) throw updateError;
        toast.success("Perfil de instrutor atualizado com sucesso!");
      } else {
        const { error: insertError } = await supabase.from("teachers").insert([payload]);
        if (insertError) throw insertError;
        toast.success("Perfil de instrutor criado com sucesso!");
      }

      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar perfil de instrutor");
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
            Complete seu Perfil de Instrutor
          </h1>
          <p className="text-muted-foreground">
            Preencha suas informações para começar a gerenciar suas turmas
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
            <Label htmlFor="specialties">
              Especialidades (separadas por vírgula)
            </Label>
            <Input
              id="specialties"
              value={formData.specialties}
              onChange={(e) =>
                setFormData({ ...formData, specialties: e.target.value })
              }
              placeholder="Jiu-Jitsu, Judô, Boxe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Breve descrição sobre você e sua experiência"
              rows={4}
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
