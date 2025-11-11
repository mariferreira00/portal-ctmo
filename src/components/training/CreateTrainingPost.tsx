import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getBrasiliaTime } from "@/lib/timezone";

interface CreateTrainingPostProps {
  onSubmit: (photo: File, caption: string, trainingDate: string) => Promise<boolean>;
}

export const CreateTrainingPost = ({ onSubmit }: CreateTrainingPostProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [trainingDate, setTrainingDate] = useState(
    format(getBrasiliaTime(), "yyyy-MM-dd")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande! Máximo 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedFile) {
      toast.error("Selecione uma foto");
      return;
    }

    if (caption.length > 500) {
      toast.error("Legenda muito longa (máx. 500 caracteres)");
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(selectedFile, caption, trainingDate);
    
    if (success) {
      // Reset form
      setSelectedImage(null);
      setSelectedFile(null);
      setCaption("");
      setTrainingDate(format(getBrasiliaTime(), "yyyy-MM-dd"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Postar Treino</h3>
            <p className="text-sm text-muted-foreground">
              Compartilhe seu progresso com a turma
            </p>
          </div>
        </div>

        {/* Image Preview or Upload Button */}
        {selectedImage ? (
          <div className="relative">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              Clique para fazer upload da foto
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP (máx. 2MB)
            </p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Caption */}
        <Textarea
          placeholder="Adicione uma legenda... (opcional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {caption.length}/500
        </p>

        {/* Training Date */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Data do Treino
          </label>
          <input
            type="date"
            value={trainingDate}
            onChange={(e) => setTrainingDate(e.target.value)}
            max={format(getBrasiliaTime(), "yyyy-MM-dd")}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Postando...
            </>
          ) : (
            "Postar Treino 💪"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Limite: 1 post por dia
        </p>
      </div>
    </Card>
  );
};
