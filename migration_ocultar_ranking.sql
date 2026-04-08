-- Adicionar coluna oculto_ranking na tabela usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS oculto_ranking BOOLEAN DEFAULT false;

-- Atualizar política de bonificações para que todos possam ler (necessário para o Mural)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias bonificações" ON public.bonificacoes;
CREATE POLICY "Todos podem ver bonificações" ON public.bonificacoes FOR SELECT USING (true);
