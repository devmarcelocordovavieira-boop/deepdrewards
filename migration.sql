-- 1. Adicionar coluna 'role' na sua tabela atual de usuários
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'player';

-- 2. Tabela de Saldo de Corujitas (Isolada para o DeepGame)
CREATE TABLE IF NOT EXISTS public.deepgame_standard_balance (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    balance integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Missões
CREATE TABLE IF NOT EXISTS public.missions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    reward_corujitas integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Missões Concluídas (Evita repetição infinita)
CREATE TABLE IF NOT EXISTS public.user_missions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, mission_id)
);

-- 5. Políticas de Segurança (RLS) para o saldo
ALTER TABLE public.deepgame_standard_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem apenas seu próprio saldo" 
ON public.deepgame_standard_balance FOR SELECT USING (auth.uid() = user_id);
