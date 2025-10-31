import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve ter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve ter pelo menos um número"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function StudentProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    emergency_contact: "",
    emergency_phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  async function fetchStudentData() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setStudentData(data);
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        birth_date: data.birth_date || "",
        emergency_contact: data.emergency_contact || "",
        emergency_phone: data.emergency_phone || "",
      });
    } catch (error: any) {
      console.error("Error fetching student data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          emergency_contact: formData.emergency_contact || null,
          emergency_phone: formData.emergency_phone || null,
        })
        .eq("id", studentData.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      fetchStudentData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordErrors({});
    setChangingPassword(true);

    try {
      const result = passwordSchema.safeParse(passwordData);

      if (!result.success) {
        const fieldErrors: { [key: string]: string } = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setPasswordErrors(fieldErrors);
        toast.error("Preencha todos os campos corretamente");
        setChangingPassword(false);
        return;
      }

      // Validar senha atual fazendo re-autenticação
      if (!user?.email) {
        toast.error("Email do usuário não encontrado");
        setChangingPassword(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: result.data.currentPassword,
      });

      if (signInError) {
        setPasswordErrors({ currentPassword: "Senha atual incorreta" });
        toast.error("Senha atual incorreta");
        setChangingPassword(false);
        return;
      }

      // Se a senha atual estiver correta, atualizar para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: result.data.newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <AvatarUpload
            currentAvatarUrl={studentData?.avatar_url}
            userType="students"
            userId={studentData?.id}
            userName={formData.full_name}
            onUploadComplete={(url) => {
              setStudentData({ ...studentData, avatar_url: url });
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
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
                  setFormData({
                    ...formData,
                    emergency_contact: e.target.value,
                  })
                }
                placeholder="Nome do contato"
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Card de Alteração de Senha */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Alterar Senha</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <PasswordInput
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, currentPassword: e.target.value });
                setPasswordErrors((prev) => ({ ...prev, currentPassword: "" }));
              }}
              className={passwordErrors.currentPassword ? "border-destructive" : ""}
            />
            {passwordErrors.currentPassword && (
              <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <PasswordInput
              id="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, newPassword: e.target.value });
                setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              className={passwordErrors.newPassword ? "border-destructive" : ""}
            />
            {passwordErrors.newPassword && (
              <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, com maiúscula, minúscula e número
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <PasswordInput
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              className={passwordErrors.confirmPassword ? "border-destructive" : ""}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
