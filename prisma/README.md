# Prisma no backend

- O Prisma ORM 7 usa `@prisma/adapter-pg`; o client gerado fica em `src/generated/prisma/` e não deve ser versionado.
- `prisma/schema.prisma` mantém somente os modelos `Equipment` e `Loan`. O schema `auth` está listado para representar a referência da FK a `auth.users`, mas não geramos modelos das tabelas internas de autenticação.
- A fonte de verdade do schema é `supabase/migrations/`. Não rode `prisma migrate`, `prisma db push` nem `supabase link`.
- Ao precisar introspectar uma mudança, rode `node --env-file-if-exists=.env.local ./node_modules/prisma/build/index.js db pull --config prisma7.config.ts` conectado apenas ao Supabase local. Como o Prisma também introspecta tabelas internas de Auth, revise e remova do `schema.prisma` os modelos de `auth` antes de gerar o client.
- `pnpm build` gera o Prisma Client e compila o Nest. `pnpm test:db` exige Docker e Supabase local em execução; testa isolamento RLS e reutilização de conexão.
- `DATABASE_URL` em `.env.local` deve apontar para `127.0.0.1:54322` durante desenvolvimento. Em ambiente hospedado, configure a URL própria desse ambiente; nunca reutilize a URL local nem use uma chave `service_role` como conexão da aplicação.
