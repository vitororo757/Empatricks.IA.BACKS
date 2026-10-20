# Spec 002 — Schema inicial de equipamentos e empréstimos

## Objetivo

Definir o schema PostgreSQL inicial do Emprest.AI, preservando as regras do PRD e aplicando Row Level Security (RLS) desde a criação das tabelas.

## Escopo

- Criar `public.equipment` para o inventário de equipamentos e sua situação operacional.
- Criar `public.loans` para relacionar equipamento e pessoa autenticada, registrar o início, o prazo e a devolução.
- Relacionar cada empréstimo a um equipamento e a um usuário existente no Supabase Auth.
- Definir empréstimo ativo como empréstimo sem devolução registrada; considerar atraso quando o prazo já passou e a devolução ainda não foi registrada.
- Habilitar RLS e criar policies explícitas nas duas tabelas na mesma migration.
- Considerar o papel de Operações apenas por claim confiável em `app_metadata`; nunca confiar em `user_metadata` editável pelo usuário.
- Manter a migration e todos os testes no Supabase local. Nenhum dado será copiado do projeto remoto.

## Regras de negócio cobertas

- Um equipamento em manutenção não pode ser emprestado nem listado como disponível.
- Um novo empréstimo deve ter prazo padrão de 14 dias corridos.
- Uma pessoa não pode iniciar empréstimo se já tiver três empréstimos ativos ou qualquer empréstimo em atraso.
- Um equipamento não pode ter mais de um empréstimo ativo ao mesmo tempo.
- Colaborador pode consultar o catálogo e seus próprios empréstimos; não pode consultar empréstimos de outra pessoa.
- Operações pode administrar equipamentos e consultar/registrar devolução dos empréstimos necessários ao atendimento.
- Operações não ganha permissão por um campo enviado pelo cliente; a autorização depende do claim confiável definido nas policies.

## Critérios de aceitação

- CA-01: As tabelas `equipment` e `loans` existem no schema `public`, com relacionamento entre elas e referência do solicitante ao Supabase Auth.
- CA-02: A migration habilita RLS e inclui policies explícitas para cada tabela.
- CA-03: O catálogo não permite que equipamentos em manutenção sejam tratados como disponíveis.
- CA-04: O banco aplica o prazo padrão de 14 dias e rejeita novo empréstimo quando o solicitante excederia o limite de três ativos ou possui atraso.
- CA-05: Não é possível criar dois empréstimos ativos para o mesmo equipamento.
- CA-06: Testes locais verificam isolamento entre colaboradores, acesso de Operações e as regras de empréstimo.
- CA-07: `supabase db reset` em banco local vazio aplica a migration sem passos manuais; não há conexão nem alteração no projeto remoto.

## Dados existentes e compatibilidade

Esta é a migration inicial do banco local: as tabelas são novas e começam vazias; não há linhas existentes para migrar ou remover. Não importar a planilha atual nesta versão.

## Fora de escopo

- Criar ou administrar usuários e conceder o papel de Operações.
- Definir como o backend NestJS/Prisma propaga o JWT/contexto de usuário para que as policies RLS sejam aplicadas em cada conexão. Esse caminho precisa ser validado antes de rotas de negócio usarem Prisma.
- API de catálogo, empréstimo ou devolução; telas do frontend; reservas futuras; notificações; importação de planilha.
