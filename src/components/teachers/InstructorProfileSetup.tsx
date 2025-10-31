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
import { AvatarUpload } from "@/components/profile/AvatarUpload";

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
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const specialtiesArray = formData.specialties
        ? formData.specialties.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const { data, error } = await supabase.from("teachers").insert([
        {
          user_id: user?.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
          bio: formData.bio || null,
          avatar_url: avatarUrl,
        },
      ]).select();

      if (error) throw error;

      if (data && data[0]) {
        setTeacherId(data[0].id);
      }

      toast.success("Perfil de instrutor criado com sucesso!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar perfil de instrutor");
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
            {teacherId ? (
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                userType="teachers"
                userId={teacherId}
                userName={formData.full_name}
                onUploadComplete={(url) => setAvatarUrl(url)}
              />
            ) : (
              <div className="p-4 bg-primary/10 rounded-full">
                <UserCircle className="w-12 h-12 text-primary" />
              </div>
            )}
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
