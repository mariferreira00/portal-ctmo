import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userType: "students" | "teachers";
  userId: string;
  userName: string;
  onUploadComplete: (url: string) => void;
}

export const AvatarUpload = ({
  currentAvatarUrl,
  userType,
  userId,
  userName,
  onUploadComplete,
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl || null
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user ID:", user?.id);
      console.log("Profile user ID:", userId);
      console.log("User type:", userType);
      
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        try {
          const oldPath = currentAvatarUrl.split("/").slice(-3).join("/");
          console.log("Deleting old avatar:", oldPath);
          await supabase.storage.from("avatars").remove([oldPath]);
        } catch (deleteError) {
          console.log("Error deleting old avatar (ignoring):", deleteError);
        }
      }

      // Upload new avatar with user folder structure
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      
      console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      console.log("Public URL:", publicUrl);

      // Update database
      const { error: updateError } = await supabase
        .from(userType)
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw updateError;
      }

      toast.success("Foto atualizada com sucesso!");
      onUploadComplete(publicUrl);
      setPreviewUrl(publicUrl);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Erro ao atualizar foto");
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="w-24 h-24">
          <AvatarImage src={previewUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-primary/20 text-primary text-2xl">
            {userName?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
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
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Clique na foto para alterar
        <br />
        (máx. 2MB)
      </p>
    </div>
  );
};
