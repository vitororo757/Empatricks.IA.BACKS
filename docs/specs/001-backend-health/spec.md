# Spec 001 — Fundação da API e health check

## Objetivo

Criar a base executável da API Emprest.AI com NestJS e disponibilizar uma rota simples para confirmar que o processo HTTP está ativo.

## Escopo

- Inicializar o backend em TypeScript com NestJS.
- Expor `GET /health` sem autenticação e sem dependência do banco.
- Retornar JSON com estado da aplicação e identificador do serviço.
- Configurar build e teste unitário com Jest.
- Não conectar ao Supabase nem executar migration nesta etapa.

## Critérios de aceitação

- CA-01: `GET /health` responde HTTP 200 com `{ "status": "ok", "service": "emprest-ai-api" }`.
- CA-02: A aplicação compila com o comando de build do backend.
- CA-03: O teste Jest valida o payload de health check.
- CA-04: A rota não depende de autenticação, banco ou variáveis secretas.

## Fora de escopo

- Autenticação JWT e autorização por papel.
- Prisma, conexão PostgreSQL, tabelas e migrations.
- Rotas de catálogo, empréstimos ou operações.
- Deploy ou alteração em Supabase/Vercel remoto.
