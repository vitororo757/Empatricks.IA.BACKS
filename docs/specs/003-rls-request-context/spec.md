# Spec 003 — Contexto de autenticação para RLS

## Objetivo

Fazer com que operações de banco executadas pelo backend atuem com a identidade autenticada do usuário e sejam limitadas pelas policies RLS existentes.

## Escopo

- Validar access tokens com o endpoint `/auth/v1/user` do projeto Supabase configurado.
- Extrair `sub` e `app_metadata` somente da resposta autenticada do Supabase; ignorar papel e identidade enviados no corpo, query ou headers alternativos.
- Configurar Prisma ORM 7 com adapter PostgreSQL e introspecção local dos schemas `public` e `auth` para resolver a FK; manter apenas `equipment` e `loans` no client, sem modelos das tabelas internas de Auth. Supabase CLI continua sendo a única ferramenta de migration.
- Registrar o Prisma Client como provider singleton do NestJS e encerrar sua conexão no shutdown.
- Executar consultas Prisma protegidas dentro de uma transação interativa, usando `SET LOCAL ROLE authenticated` e `set_config('request.jwt.claims', ..., true)` antes de qualquer consulta de negócio.
- Incluir nos claims somente `sub`, `role: authenticated` e `app_metadata` validado, para as policies existentes de `auth.uid()` e `auth.jwt()`.
- Garantir que configuração ausente, token inválido, erro de rede, ou role inesperada falhe fechado, sem executar consulta de negócio.
- Não adicionar rotas de negócio, mudar schema/migrations, criar usuários ou modificar o Supabase remoto.

## Critérios de aceitação

- CA-01: Token ausente ou inválido é rejeitado antes de acessar dados.
- CA-02: A identidade/role vem da validação do Supabase Auth; `user_metadata` e inputs do cliente não concedem papel de Operações.
- CA-03: Claims e role PostgreSQL são configurados dentro da mesma transação Prisma que executa a consulta; claims são locais à transação e não vazam pelo pool.
- CA-04: Falha ao configurar contexto aborta a transação e não executa callback de negócio.
- CA-05: Testes verificam rejeição de token, extração segura de claims e ordem de configuração/transação.
- CA-06: Prisma Client é gerado a partir do banco local, o backend conecta e desconecta corretamente em shutdown, sem Prisma Migrate ou alteração de schema.
- CA-07: Teste de integração local confirma `auth.uid()` e isolamento RLS ao executar consulta Prisma em identidade simulada; contexto de uma transação não aparece na seguinte.

## Configuração

Usar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no servidor para validar tokens. A conexão PostgreSQL do Prisma deverá usar credencial com permissão para assumir `authenticated`; nunca usar uma chave Supabase `service_role` para ignorar RLS.

O schema Prisma é uma projeção para o client, não uma segunda fonte de migrations. Ele não modela as tabelas internas de `auth`, checks, triggers ou o índice único parcial de empréstimo ativo; esses objetos permanecem definidos e verificados pelas migrations SQL.

## Fora de escopo

- Rotas de catálogo, empréstimo ou devolução.
- Configuração de variáveis em painel Vercel ou qualquer alteração no projeto Supabase remoto.
