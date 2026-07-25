# Marketplace Sales Manager

Sistema de gestão de vendas multi-marketplace (Shopee, Mercado Livre, Amazon, Magalu, Shein, etc.) para múltiplos CNPJs, com dashboard, metas, rankings, relatórios e auditoria.

Stack: React 19 + TypeScript + Vite + Tailwind, Express (dev), Supabase (Postgres + Auth), deploy na Vercel.

## Rodando localmente

**Pré-requisitos:** Node.js 18+, uma conta/projeto no [Supabase](https://supabase.com).

1. Instale as dependências:
   `npm install`
2. Copie `.env.example` para `.env.local` e preencha:
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API no Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (mesma tela — nunca exponha publicamente)
   - `GEMINI_API_KEY` (opcional, para os resumos executivos com IA)
3. Rode a migration em `supabase/migrations/0001_init.sql` no SQL Editor do seu projeto Supabase (cria as tabelas e políticas de RLS).
4. Crie o primeiro usuário administrador em Authentication → Users no painel do Supabase, e depois atualize `role` para `admin` na tabela `profiles`.
5. Inicie o app:
   `npm run dev`

## Deploy

O projeto está configurado para deploy na Vercel (build com Vite + funções serverless em `/api` para IA e gestão de usuários). Configure as mesmas variáveis de ambiente no painel da Vercel.
