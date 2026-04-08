-- Tabela de Bonificações
CREATE TABLE IF NOT EXISTS public.bonificacoes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    pontos integer NOT NULL,
    motivo text,
    lida boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de Segurança (RLS) para bonificações
ALTER TABLE public.bonificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias bonificações" 
ON public.bonificacoes FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Admins podem gerenciar bonificações" 
ON public.bonificacoes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
