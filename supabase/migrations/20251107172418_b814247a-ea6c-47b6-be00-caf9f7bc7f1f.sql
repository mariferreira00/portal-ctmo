-- Adicionar campo de data aos avisos
ALTER TABLE public.announcements
ADD COLUMN announcement_date date NOT NULL DEFAULT CURRENT_DATE;

-- Criar índice para melhorar performance de filtros por data
CREATE INDEX idx_announcements_date ON public.announcements(announcement_date);