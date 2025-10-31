import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

export default function InstructorProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    specialties: "",
  });

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  async function fetchTeacherData() {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setTeacherData(data);
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        specialties: data.specialties?.join(", ") || "",
      });
    } catch (error: any) {
      console.error("Error fetching teacher data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const specialtiesArray = formData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error } = await supabase
        .from("teachers")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          bio: formData.bio || null,
          specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
        })
        .eq("id", teacherData.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      fetchTeacherData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
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
          Gerencie suas informações profissionais
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <AvatarUpload
            currentAvatarUrl={teacherData?.avatar_url}
            userType="teachers"
            userId={teacherData?.id}
            userName={formData.full_name}
            onUploadComplete={(url) => {
              setTeacherData({ ...teacherData, avatar_url: url });
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
              <Label htmlFor="specialties">Especialidades</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) =>
                  setFormData({ ...formData, specialties: e.target.value })
                }
                placeholder="Jiu-Jitsu, MMA, Muay Thai"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Conte um pouco sobre sua experiência e trajetória..."
              rows={4}
            />
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
    </div>
  );
}
