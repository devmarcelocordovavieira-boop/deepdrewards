-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pontos INTEGER DEFAULT 0,
  pontos_acumulados INTEGER DEFAULT 0,
  cargo TEXT CHECK (cargo IN ('admin', 'comum')) DEFAULT 'comum',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_pontos INTEGER NOT NULL CHECK (preco_pontos >= 0),
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script to add ordem to existing table if needed
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Tabela de Resgates
CREATE TABLE resgates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  usado BOOLEAN DEFAULT false,
  data_resgate TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOVAS TABELAS: DEEPRANKING

-- Tabela de Tipos de Tarefas
CREATE TABLE tipos_tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  pontos INTEGER NOT NULL CHECK (pontos > 0),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Submissões
CREATE TABLE submissoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tarefa_id UUID REFERENCES tipos_tarefas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  url_prova TEXT NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'aprovado', 'rejeitado')) DEFAULT 'pendente',
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_avaliacao TIMESTAMP WITH TIME ZONE
);

-- CONFIGURAÇÃO DE STORAGE (SUPABASE)
-- Criação do Bucket 'provas_midia'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('provas_midia', 'provas_midia', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Segurança para o Storage (RLS)
-- Permite que qualquer usuário autenticado faça upload
CREATE POLICY "Permitir upload para usuarios autenticados" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'provas_midia');

-- Permite leitura pública dos arquivos
CREATE POLICY "Permitir leitura publica" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'provas_midia');

-- Função para realizar o resgate com transação (Atomicidade)
CREATE OR REPLACE FUNCTION realizar_resgate(p_usuario_id UUID, p_produto_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_preco INTEGER;
  v_estoque INTEGER;
  v_pontos INTEGER;
BEGIN
  -- Bloqueia a linha do produto para atualização (evita concorrência)
  SELECT preco_pontos, estoque INTO v_preco, v_estoque
  FROM produtos
  WHERE id = p_produto_id AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou inativo.';
  END IF;

  IF v_estoque <= 0 THEN
    RAISE EXCEPTION 'Produto fora de estoque.';
  END IF;

  -- Bloqueia a linha do usuário
  SELECT pontos INTO v_pontos
  FROM usuarios
  WHERE id = p_usuario_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF v_pontos < v_preco THEN
    RAISE EXCEPTION 'Pontos insuficientes.';
  END IF;

  -- Atualiza estoque e pontos
  UPDATE produtos SET estoque = estoque - 1 WHERE id = p_produto_id;
  UPDATE usuarios SET pontos = pontos - v_preco WHERE id = p_usuario_id;

  -- Registra o resgate
  INSERT INTO resgates (usuario_id, produto_id) VALUES (p_usuario_id, p_produto_id);

  RETURN TRUE;
END;
$$;

-- Função para aprovar submissão com transação (Atomicidade)
CREATE OR REPLACE FUNCTION aprovar_submissao(p_submissao_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_status TEXT;
  v_usuario_id UUID;
  v_tarefa_id UUID;
  v_pontos_tarefa INTEGER;
BEGIN
  -- Bloqueia a submissão
  SELECT status, usuario_id, tarefa_id INTO v_status, v_usuario_id, v_tarefa_id
  FROM submissoes
  WHERE id = p_submissao_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submissão não encontrada.';
  END IF;

  IF v_status != 'pendente' THEN
    RAISE EXCEPTION 'Submissão já foi avaliada.';
  END IF;

  -- Pega os pontos da tarefa
  SELECT pontos INTO v_pontos_tarefa
  FROM tipos_tarefas
  WHERE id = v_tarefa_id;

  -- Atualiza status da submissão
  UPDATE submissoes 
  SET status = 'aprovado', data_avaliacao = NOW() 
  WHERE id = p_submissao_id;

  -- Adiciona pontos ao usuário
  UPDATE usuarios 
  SET pontos = pontos + v_pontos_tarefa,
      pontos_acumulados = COALESCE(pontos_acumulados, 0) + v_pontos_tarefa
  WHERE id = v_usuario_id;

  RETURN TRUE;
END;
$$;

-- Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resgates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissoes ENABLE ROW LEVEL SECURITY;

-- Produtos e Tarefas visíveis para todos
CREATE POLICY "Produtos visíveis" ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "Tarefas visíveis" ON tipos_tarefas FOR SELECT USING (ativo = true);

-- Ranking visível para todos
CREATE POLICY "Ranking visível" ON usuarios FOR SELECT USING (true);

