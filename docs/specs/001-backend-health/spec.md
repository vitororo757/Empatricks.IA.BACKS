# Spec 001 — Fundação da API e health check

## Objetivo

Criar a base executável da API Emprest.AI com NestJS e disponibilizar respostas JSON simples para confirmar que o processo HTTP está ativo, localmente e no runtime Vercel.

## Escopo

- Inicializar o backend em TypeScript com NestJS.
- Usar o entrypoint `src/main.ts`, reconhecido pela integração nativa de NestJS da Vercel.
- Escutar `process.env.PORT` quando fornecida pelo runtime, mantendo `3000` como padrão local.
- Expor `GET /` e `GET /health` sem autenticação e sem dependência do banco.
- Retornar JSON com estado da aplicação e identificador do serviço.
- Configurar build e teste unitário com Jest.
- Não conectar ao Supabase nem executar migration nesta etapa.
- Não publicar deploy nem alterar o painel/configuração remota da Vercel nesta etapa.

## Critérios de aceitação

- CA-01: `GET /` responde HTTP 200 com `{ "status": "ok", "service": "emprest-ai-api" }`.
- CA-02: `GET /health` continua respondendo HTTP 200 com `{ "status": "ok", "service": "emprest-ai-api" }`.
- CA-03: O processo escuta a porta indicada por `PORT`, ou a porta 3000 quando a variável não está definida.
- CA-04: A aplicação compila com o comando de build do backend.
- CA-05: Testes Jest validam os payloads das duas rotas.
- CA-06: As rotas não dependem de autenticação, banco ou variáveis secretas.
- CA-07: A inicialização mantém o entrypoint NestJS reconhecível pela plataforma, sem exigir adaptador de terceiros.

## Fora de escopo

- Autenticação JWT e autorização por papel.
- Prisma, conexão PostgreSQL, tabelas e migrations.
- Rotas de catálogo, empréstimos ou operações.
- Publicação do deploy, configuração do projeto no painel Vercel ou alteração em Supabase remoto.
