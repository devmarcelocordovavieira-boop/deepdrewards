# DEEP GAME - Plataforma de Gamificação

O **DEEP GAME** é uma plataforma completa de gamificação projetada para engajar equipes através de missões, recompensas e um sistema de ranking competitivo. Desenvolvido como uma Single Page Application (SPA) moderna, rápida e responsiva.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Lucide React (Ícones)
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth, Storage)
- **Hospedagem Recomendada:** Cloudflare Pages ou Vercel

## ✨ Principais Funcionalidades

- **Sistema de Missões:** Usuários podem enviar fotos/vídeos de missões concluídas para aprovação.
- **Catálogo de Prêmios:** Resgate de recompensas utilizando os pontos acumulados.
- **Ranking Competitivo:** Tabela de classificação em tempo real com níveis (Iniciante, Bronze, Prata, Ouro, Diamante).
- **Mural de Atividades:** Feed público mostrando as últimas conquistas e resgates da equipe.
- **Painel Administrativo:** Área exclusiva para administradores aprovarem missões, gerenciarem o catálogo e penalizarem/removerem usuários.

---

## 🛠️ Guia de Instalação e Deploy

### 1. Configuração do Banco de Dados (Supabase)

1. Crie uma conta e um novo projeto no [Supabase](https://supabase.com/).
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie o conteúdo do arquivo `supabase.sql` incluído neste projeto e execute-o. Isso criará todas as tabelas, políticas de segurança (RLS) e funções necessárias.
4. Vá em **Storage** e crie um novo bucket chamado `provas_midia` e torne-o **Público**.
5. Vá em **Project Settings > API** e copie a sua `Project URL` e a `anon public key`.

### 2. Configuração Local (Desenvolvimento)

1. Clone o repositório.
2. Crie um arquivo `.env` na raiz do projeto com as suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```
3. Instale as dependências executando `npm install`.
4. Inicie o servidor de desenvolvimento com `npm run dev`.

### 3. Deploy no Cloudflare Pages (Recomendado)

1. Envie o código deste projeto para um repositório no **GitHub**.
2. Crie uma conta no [Cloudflare](https://dash.cloudflare.com/) e vá em **Workers & Pages > Create application > Pages > Connect to Git**.
3. Conecte sua conta do GitHub e selecione o repositório do projeto.
4. Nas configurações de build, configure:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Expanda a seção **Environment variables (advanced)** e adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL`: Cole a URL do seu projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Cole a sua chave `anon public` do Supabase.
6. Clique em **Save and Deploy**.

---

## 👑 Primeiro Acesso (Admin)

O primeiro usuário a se cadastrar na plataforma através do link de registro padrão será automaticamente definido como um usuário comum. Para transformá-lo em **Administrador**:

1. Acesse o painel do Supabase.
2. Vá em **Table Editor > usuarios**.
3. Encontre o seu usuário e altere a coluna `cargo` de `comum` para `admin`.
4. Recarregue a página da aplicação. O menu "Admin" agora estará disponível.
