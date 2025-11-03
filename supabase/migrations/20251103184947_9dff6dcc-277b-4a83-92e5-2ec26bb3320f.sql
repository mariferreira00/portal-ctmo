-- Adicionar coluna days_of_week à tabela subclasses para armazenar os dias da semana
ALTER TABLE subclasses ADD COLUMN days_of_week TEXT[] DEFAULT '{}';

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN subclasses.days_of_week IS 'Array com os dias da semana: segunda, terça, quarta, quinta, sexta, sábado, domingo';