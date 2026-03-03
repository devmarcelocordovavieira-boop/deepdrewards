# Deep Rewards - Deploy Guide

Este projeto foi desenvolvido como uma Single Page Application (SPA) em React com Vite, utilizando **Cloudflare Pages** para hospedagem e **Supabase (PostgreSQL)** para o banco de dados.

## 1. Configuração do Banco de Dados (Supabase)

1. Crie uma conta e um novo projeto no [Supabase](https://supabase.com/).
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie o conteúdo do arquivo `supabase.sql` gerado neste projeto e execute-o no editor. Isso criará as tabelas necessárias e as funções RPC.
4. Vá em **Project Settings > API** e copie a sua `Project URL` e a `anon public key`.

## 2. Deploy no Cloudflare Pages

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

## 3. Estrutura do Projeto

- `src/App.tsx`: Interface Frontend (SPA) construída com React e Tailwind CSS.
- `public/_redirects`: Arquivo de configuração para o Cloudflare Pages rotear todas as requisições para o `index.html` (necessário para SPAs).
- `supabase.sql`: Script de modelagem do banco de dados relacional.
