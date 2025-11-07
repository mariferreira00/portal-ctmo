import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreateAnnouncementProps {
  isAdmin?: boolean;
  instructorClasses?: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function CreateAnnouncement({ isAdmin, instructorClasses = [], onSuccess }: CreateAnnouncementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [classId, setClassId] = useState<string | null>(null);
  const [isSystem, setIsSystem] = useState(false);
  const [announcementDate, setAnnouncementDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin && !classId) {
      toast({
        title: "Selecione uma turma",
        description: "Professores devem selecionar uma turma",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("announcements").insert([{
        title: title.trim(),
        content: content.trim(),
        class_id: isSystem ? null : classId,
        is_system: isAdmin && isSystem,
        created_by: user.id,
        announcement_date: format(announcementDate, "yyyy-MM-dd"),
      }]);

      if (error) throw error;

      toast({
        title: "Aviso criado!",
        description: "O aviso foi publicado com sucesso",
      });

      setTitle("");
      setContent("");
      setClassId(null);
      setIsSystem(false);
      setAnnouncementDate(new Date());
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Erro ao criar aviso",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Aviso
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Aviso</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Importante - Mudança de horário"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Mensagem</Label>
            <Textarea
              id="content"
              placeholder="Escreva sua mensagem aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Data do Aviso</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !announcementDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {announcementDate ? format(announcementDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={announcementDate}
                  onSelect={(date) => date && setAnnouncementDate(date)}
                  locale={ptBR}
                  disabled={loading}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              O aviso será exibido apenas nesta data
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="system-announcement">Aviso do Sistema</Label>
                <p className="text-xs text-muted-foreground">
                  Visível para todos os alunos
                </p>
              </div>
              <Switch
                id="system-announcement"
                checked={isSystem}
                onCheckedChange={setIsSystem}
                disabled={loading}
              />
            </div>
          )}

          {!isSystem && (
            <div className="space-y-2">
              <Label htmlFor="class">
                {isAdmin ? "Turma (opcional)" : "Turma"}
              </Label>
              <Select value={classId || ""} onValueChange={setClassId} disabled={loading}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {instructorClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
