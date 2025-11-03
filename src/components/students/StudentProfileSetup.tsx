import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, Camera, Loader2 } from "lucide-react";

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
    payment_due_day: "5",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Preenche o nome completo a partir dos metadados do usuário
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFormData(prev => ({
        ...prev,
        full_name: user.user_metadata.full_name
      }));
    }
  }, [user]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setAvatarFile(file);
    
    // Criar preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("Erro: Usuário não autenticado");
      return;
    }
    
    console.log("User ID:", user.id); // Debug
    setIsSubmitting(true);

    try {
      let avatarUrl: string | null = null;

      // Upload avatar se selecionado
      if (avatarFile) {
        setUploadingAvatar(true);
        
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `students/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        // Obter URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = publicUrl;
        setUploadingAvatar(false);
      }

      // Criar registro do aluno
      const studentData = {
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        monthly_fee: 90.00,
        payment_due_day: parseInt(formData.payment_due_day),
        avatar_url: avatarUrl,
      };
      
      console.log("Tentando inserir dados:", studentData); // Debug
      
      const { error } = await supabase.from("students").insert([studentData]);

      if (error) {
        console.error("Erro detalhado:", error); // Debug
        throw error;
      }

      toast.success("Perfil de aluno criado com sucesso!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar perfil de aluno");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setUploadingAvatar(false);
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
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="relative group">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || undefined} alt={formData.full_name} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {formData.full_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
                disabled={isSubmitting || uploadingAvatar}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Clique na foto para adicionar uma imagem
              <br />
              (máx. 2MB)
            </p>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="payment_due_day">Dia de Vencimento da Mensalidade *</Label>
            <select
              id="payment_due_day"
              value={formData.payment_due_day}
              onChange={(e) =>
                setFormData({ ...formData, payment_due_day: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {[...Array(28)].map((_, i) => {
                const day = i + 1;
                return (
                  <option key={day} value={day}>
                    Dia {day}
                  </option>
                );
              })}
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || uploadingAvatar || !formData.full_name || !formData.email}
          >
            {isSubmitting || uploadingAvatar ? "Salvando..." : "Completar Perfil"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
