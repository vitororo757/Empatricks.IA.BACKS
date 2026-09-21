# ADR-001: Stack

## Decisões

| Item | Escolha |
|---|---|
| Host | Supabase |
| Frontend | TypeScript + React |
| Backend | TypeScript + NestJS |
| ORM | Prisma |
| Validação | Zod |
| Autenticação | RLS |
| Autorização | Supabase |
| Banco | PostgreSQL (Supabase) |
| API | REST com MVC |
| Testes | Jest |
| Migration | não decidido |

## Justificativas

- **Host:** não decidido
- **Frontend:** não decidido
- **Backend:** não decidido
- **ORM:** não decidido
- **Validação:** não decidido
- **Autenticação:** não decidido
- **Autorização:** não decidido
- **Banco:** não decidido
- **API:** não decidido
- **Testes:** não decidido
- **Migration:** não decidido

## Alternativas descartadas

não decidido

## Consequências

**Fica mais fácil:**
- Provisionar auth, banco e RLS num único provedor (Supabase), sem integrar serviços separados de auth e banco.
- Tipagem ponta a ponta (TypeScript no front e no back) reduz divergência de contrato entre camadas.
- Validação de entrada consistente com Zod, reaproveitável entre camadas que rodam em TypeScript.
- Migrations e acesso a dados via Prisma, sem SQL manual para operações CRUD comuns.

**Fica mais difícil:**
- Trocar de provedor de auth/banco no futuro exige migrar RLS, políticas e configuração de autenticação junto — não são componentes isolados.
- Qualquer lógica de autorização que dependa de RLS fica acoplada ao dialeto e às capacidades do Postgres/Supabase.
- Queries complexas ou otimizações finas de banco passam pela camada de abstração do Prisma, que nem sempre expõe tudo que o Postgres oferece.

**O que isso impede de fazer depois sem custo:**
- Trocar de banco (sair do Postgres) sem reescrever autenticação, autorização (RLS) e camada de acesso a dados (Prisma).
- Sair do Supabase mantendo o mesmo modelo de autorização, já que a autorização aqui foi decidida como responsabilidade do Supabase.
- Adotar outro ORM sem revisar todas as migrations e o mapeamento de schema já existentes.

## O que este ADR NÃO decide

- Estratégia de migration (item deixado como "não decidido").
- Infraestrutura de deploy/hospedagem além do Supabase (CI/CD, ambientes, escalabilidade).
- Arquitetura interna do frontend (gerenciamento de estado, roteamento, styling).
- Observabilidade, logging e monitoramento.
- Estratégia de cache.
- Política de versionamento de API.
- Cobertura mínima de testes ou estratégia de CI para os testes Jest.
