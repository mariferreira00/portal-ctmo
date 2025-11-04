-- Remover a política restritiva atual
DROP POLICY IF EXISTS "Users can view posts from their context" ON training_posts;

-- Criar política simples: todos os usuários autenticados podem ver todos os posts
CREATE POLICY "Authenticated users can view all training posts"
ON training_posts
FOR SELECT
USING (
  -- Qualquer usuário autenticado pode ver todos os posts
  auth.uid() IS NOT NULL
);