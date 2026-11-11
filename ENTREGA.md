# Entrega da prática — em andamento

Esta entrega ainda não está pronta para avaliação: faltam fotos revisadas, implantação e validação em produção, além de evidência de revisão independente completa. As decisões a seguir foram adotadas provisoriamente a partir da autorização dada pelo usuário; não representam fatos de produção.

## Links

- Back-end: https://github.com/vitororo757/Empatricks.IA.BACKS
- Front-end: https://github.com/vitororo757/Empatricks.IA.FRONT
- Produção Vercel: ainda não identificada ou verificada.

## 1. Conflitos

| Pedido | Conflito | Decisão e motivo | Evidência | Commit |
|---|---|---|---|---|
| Senha escrita no arquivo de dados | Regra geral proíbe senha no código e histórico | Usar variável de ambiente ou entrada manual, nunca versionar a senha | Enunciado, regra geral e briefing de dados | Pendente |
| Pexels como fonte obrigatória | O usuário alterou expressamente a fonte para Pixabay | Utilizar Pixabay e identificar a fonte; não usar hotlink permanente | https://pixabay.com/api/docs/ | Pendente |
| Catálogo sem crédito | O contrato pede crédito e o Pixabay solicita identificação da origem | Exibir “Fotos: Pixabay” com link | https://pixabay.com/api/docs/ | Pendente |
| TI-0010 disponível no briefing | Lista fixa determina TI-0010 em manutenção | Prevalece lista explícita e integral: TI-0004, TI-0007 e TI-0010 em manutenção | Lista fixa no enunciado | Pendente |
| 5 empréstimos, 14 dias úteis | Spec anterior definia 3 empréstimos e 14 dias corridos | Adotar novo briefing como mudança explícita para esta prática; registrar nas specs e migration | `docs/specs/002-database-schema/spec.md` | Pendente |
| Verificador corrigir teste | Independência proíbe o verificador corrigir o que encontra | Retornar falha ao implementador e verificar novamente | `docs/verificador-spec.md` | Pendente |

O enunciado menciona `docs/PRD.md` e `rules/`, mas esses arquivos não foram encontrados nos checkouts atuais; não é possível alegar que foram conferidos. A decisão sobre limites usa a spec existente como evidência disponível.

## 1b. Lacunas

| Spec | Lacuna | Alternativas | Decisão provisória e motivo | Commit |
|---|---|---|---|---|
| 004 | Situação divergente na reexecução | Sobrescrever ou interromper | Interromper para proteger alterações e empréstimos existentes | Pendente |
| 005 | Feriados e contagem | Calendário oficial ou somente dias da semana | Segunda a sexta, sem feriados; começa no dia seguinte, pois não foi fornecido calendário | Pendente |
| 005 | Fuso e atraso | UTC ou horário local | America/Sao_Paulo; vencimento hoje ainda não está atrasado | Pendente |

## 2. Onde o agente tentou decidir

Na implementação o agente propôs aplicar 5 empréstimos e 14 dias úteis, em conflito com a spec anterior. O conflito foi identificado pela leitura da spec e registrado como mudança em vez de ser tratado como regra anterior. Decisões deste documento são propostas técnicas adotadas com a autorização geral do usuário, não uma declaração de que ele revisou cada alternativa pessoalmente.

## 3. Decisão e ADR

Não há ADR novo concluído para prazo, limite ou calendário. Uma escolha sobre contabilização de dias úteis e feriados pode justificar ADR se tiver alcance arquitetural duradouro; por enquanto deve estar na spec e ser testada. O ADR existente mantém Supabase CLI e migrations SQL como fonte da verdade.

## 4. Skill de imagens

`.agents/skills/imagens-equipamentos/SKILL.md` define gatilho, restrições e fluxo; `references/processo.md` contém procedimento e fontes; `scripts/` consulta a API e faz processamento local. O script valida patrimônios, IDs, hashes dos arquivos baixados e dimensões; não é capaz de comprovar ausência de pessoas, marcas e textos nem equivalência de fotos reexportadas. Por isso, a revisão visual individual é obrigatória antes e depois do recorte. Os scripts não publicam no Storage. O isolamento do agente em relação à produção depende das permissões do ambiente, não apenas do texto da skill.

Busca real no Pixabay executada com a chave fornecida pelo usuário; resultados e chave permanecem na pasta ignorada `imagens-trabalho/`. Na primeira revisão, 31 de 32 candidatas baixadas foram rejeitadas por pessoa, marca ou texto visível, conteúdo em tela ou equipamento inadequado; a ampliação revelou inclusive texto em um cabo inicialmente considerado promissor. Após buscas adicionais e revisão dos recortes, 12 fotos distintas foram preparadas em 800×600 e enviadas ao bucket público `equipamentos`, criado após autorização específica do usuário para acesso público e envio das fotos. As 12 URLs foram acessadas sem login, seus JPEGs foram baixados e conferidos quanto a dimensões e hash distintos, e os créditos registrados em `docs/creditos-imagens.json` e `creditos-12-20261111.json` no bucket. A webcam usa imagem ilustrativa de câmera de videoconferência, sem comprovar modelo ou resolução do item real. O envio repetido de um arquivo no mesmo caminho retornou conflito 409, sem duplicá-lo; um fluxo que trate esse conflito automaticamente ainda falta.

## 5. Subagente verificador

`AGENTS.md` e `docs/verificador-spec.md` determinam a revisão antes da conclusão, a leitura das duas partes e o formato comparável por critério; proibem que o revisor corrija falhas. É uma regra de processo, não um gatilho técnico comprovado. Nesta sessão, os subagentes compartilham ambiente e permissões: não há prova de bloqueio técnico de escrita ou de isolamento de credenciais de produção. Para cumprir o requisito integralmente, falta executar o revisor em ambiente segregado, sem segredos e com repositórios somente leitura, além de integrar o gatilho ao harness.

## 6. Verificador em ação

Uma rodada identificou que uma falha durante o processamento das fotos deixaria um manifesto antigo ao lado de imagens parcialmente substituídas. O agente principal alterou o processo para invalidar o manifesto antes do primeiro download; a nova inspeção confirmou a correção, condicionada ao respeito à regra de não usar pasta sem manifesto. Outra rodada encontrou risco de reutilizar cache Pexels e de repetir buscas Pixabay após falha; o cache passou a ser específico do provedor, com registro por consulta. A revisão também apontou carga que sobrescrevia situação divergente e uso inválido de variável no `\copy`; a correção foi revista estaticamente, mas ainda não executada.

A rodada seguinte registrou os resultados abaixo. **NV** significa não verificado: código encontrado não comprova execução nem produção. Evidências principais: `docs/specs/004-dados-iniciais/spec.md`, `docs/specs/005-solicitar-emprestimo/spec.md`, `supabase/carga-manual.sql`, migration da prática e `src/loans.controller.ts`; no front, `docs/specs/006-catalogo-emprestimos/spec.md` e `src/App.tsx`.

| Spec | Critério | Resultado | Evidência ou pendência |
|---|---|---|---|
| 004 | CA-01 e CA-02 | NV | Carga enumera os 12 e os estados decididos; banco não populado |
| 004 | CA-03 e CA-04 | NV | Faltam fotos revisadas, licenças e URLs públicas reais |
| 004 | CA-05 | NV | Conta e autenticação não testadas |
| 004 | CA-06 | NV | SQL propõe transação e recusa de conflitos; reexecução não testada |
| 004 | CA-07 | NV | Operações e evidências de produção pendentes |
| 005 | CA-01 a CA-03 | NV | Guard, rotas e triggers existem; integração não exercitada |
| 005 | CA-04 e CA-05 | NV | Prazo, fuso, limite e mensagens definidos; falta execução integrada |
| 005 | CA-06 | NV | Bloqueios e índice previstos; concorrência não testada |
| 005 | CA-07 e CA-08 | NV | Filtro, RLS e autenticação previstos; isolamento não testado em execução |
| 005 | CA-09 | NV | Link ao Pixabay presente; licenças das fotos reais não verificadas |
| Front 006 | CA-01 a CA-05 e CA-07 | NV | Comportamentos implementados; falta teste integrado |
| Front 006 | CA-06 | PASSOU em inspeção estática | Links Pixabay no catálogo e na tela de empréstimos com fotos |

A prova com erro plantado e seus dois commits ainda está pendente. Nenhuma spec é declarada pronta até haver evidências registradas.

Validação local adicional: o build do front-end passou. No back-end, a geração do Prisma e compilação do Nest passaram; o Jest registrou 10 testes aprovados e uma integração de banco ignorada. Em banco PGlite isolado (`test/pglite-isolated-check.mjs`), as migrations e a lógica de carga com dados fictícios foram executadas: 12 itens, três em manutenção, reexecução idempotente, recusa de conflito, rollback, prazo, limite e isolamento básico. O teste substitui o comando `\copy` por inserções de teste e usa uma dependência transitiva; não comprova o cliente psql, o Supabase Auth/Storage, concorrência real ou a produção. Não havia `psql` ou Docker disponíveis para teste Supabase local completo.

O projeto Supabase foi identificado e a CLI vinculada. Após autorização expressa do usuário, as duas migrations foram aplicadas e um novo `db push --dry-run` confirmou que não havia migrations pendentes. A carga parcial `supabase/carga-inicial-sem-fotos.sql` foi aplicada duas vezes: a consulta de verificação retornou 12 equipamentos e patrimônios distintos, três em manutenção e zero empréstimos. As imagens ficaram nulas conforme autorização do usuário para deixá-las pendentes. A conta do professor foi criada pelo usuário; a consulta confirmou uma conta com e-mail confirmado e zero empréstimos. O login e a carga de imagens ainda não foram verificados.

## 7. Regra posta à prova

A orientação para o revisor não escrever é insuficiente como fronteira de segurança: subagentes compartilham o ambiente. `docs/verificador-spec.md` agora distingue instrução de controle técnico e exige ambiente separado para revisão segura; a segregação ainda não foi implementada.

## 8. Fora do escopo ou pendente

- Testar o catálogo publicado com as imagens e crédito Pixabay, além de tornar o envio repetido automaticamente idempotente.
- A aplicação das migrations e carga parcial de dados foram feitas após autorização expressa; a regra original do exercício previa execução pelo próprio usuário. Não disponibilizar segredos no repositório.
- Identificar e verificar o deploy Vercel e usar conta de teste própria, preservando a conta do professor com zero empréstimos.
- Concluir revisão independente por critério, prova com erro plantado, testes necessários, commits e tag nos dois repositórios. Não criar uma tag de entrega enquanto estiver incompleta.
