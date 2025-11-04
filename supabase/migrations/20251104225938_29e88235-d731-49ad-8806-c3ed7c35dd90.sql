-- Corrigir as datas das fotos já postadas adicionando 1 dia
-- Isso resolve o problema de timezone que estava mostrando as fotos como d-1
UPDATE training_posts
SET training_date = training_date + INTERVAL '1 day'
WHERE training_date < CURRENT_DATE;