# Revisão da prática — evidências e limites

Data: 11/11/2026. O revisor recebeu os caminhos para leitura, sem acesso intencional a produção ou credenciais, e não alterou arquivos. Entretanto, os subagentes compartilham o ambiente e suas permissões: esta rodada não demonstra isolamento técnico nem gatilho automático.

## Demonstração com erro plantado — spec 005

A prova foi feita na ramificação `prova-verificador`, separada de `main`, e não alterou o banco ou a implantação de produção. O commit `32f350f` mudou o limite de `>= 5` para `>= 4`; o commit `e5106d8` reverteu a alteração. O revisor não recebeu a descrição do erro antes da primeira análise.

| Spec | Critério | Primeira rodada | Evidência |
|---|---|---|---|
| 005 | CA-04 | PASSOU em análise estática | A função `loan_due_date` conta 14 dias de segunda a sexta desde o dia seguinte, no fuso definido. |
| 005 | CA-05 | FALHOU | `20261111000000_practice_loans.sql:31` recusava o quinto empréstimo quando havia quatro ativos, apesar da spec permitir cinco. |
| 005 | CA-06 | NÃO VERIFICADO | Há locks e índice único, mas a revisão não executou concorrência real; o limite também estava errado. |
| 005 | CA-07 | PASSOU em análise estática | Controller filtra pela identidade e pelos empréstimos ativos e seleciona equipamento e vencimento. |
| 005 | CA-01, CA-02, CA-03, CA-08 e CA-09 | NÃO VERIFICADO | A revisão estática não comprovou os fluxos integrados, os direitos das fotos nem o isolamento efetivo. |

Na segunda rodada, após `e5106d8`, a mesma pessoa revisora classificou CA-05 como **PASSOU em análise estática**, pois a migration voltou a usar `active_count >= 5`; CA-04 e CA-07 continuaram passando estaticamente, e CA-01, CA-02, CA-03, CA-06, CA-08 e CA-09 permaneceram não verificados em execução. O revisor não testou concorrência nem o banco. Portanto, a prova demonstra a detecção e correção desta falha específica, não aprovação integral da spec.

## Revisão das specs 004, 005 e front 006

Uma rodada independente de leitura apontou que a tela recebia `borrowedAt`, mas não mostrava a data de retirada (front 006 CA-05). O agente principal corrigiu a tela no commit de front `e98ab75`; o build TypeScript/Vite passou. Na revisão seguinte foi encontrada uma possível corrida na troca de sessão; a correção está no front `5a8016d`. A nova leitura estática não encontrou outra falha específica no CA-05, mas não comprovou o isolamento do backend. A revisão não executou PGlite por falha de permissão do ambiente (`EPERM`); isso não é evidência de defeito no teste nem aprovação dos critérios.

| Spec | Critério | Resultado | Evidência ou motivo |
|---|---|---|---|
| 004 | CA-01, CA-02 | PARCIAL | Teste PGlite isolado conferiu 12 itens fictícios e três em manutenção; produção já foi observada no catálogo, mas a rodada do revisor não acessou o deploy. |
| 004 | CA-03, CA-04 | PARCIAL | `docs/creditos-imagens.json` registra 12 fotos e seus créditos; as URLs e dimensões foram conferidas anteriormente. A adequação visual e licença individual dependem de revisão, e a webcam é ilustrativa. |
| 004 | CA-05 | PARCIAL | Login do professor e zero empréstimos foram reconferidos em 11/11/2026. O usuário relatou usar outra conta nos testes. |
| 004 | CA-06 | PARCIAL | Reexecução da carga fictícia e rollback passaram em PGlite; upload repetido retornou 409 e não foi demonstrado fluxo automático completo idempotente. |
| 004 | CA-07 | PARCIAL | Aplicação e upload feitos após autorização expressa do usuário; o enunciado original previa execução pelo responsável. |
| 005 | CA-01, CA-03, CA-07 | PARCIAL | Login e catálogo foram observados; o usuário relatou testar um empréstimo com outra conta. Não há registro detalhado de cada passo nem validação independente de todo o fluxo. |
| 005 | CA-02, CA-04, CA-05 | PARCIAL | PGlite isolado verificou manutenção, prazo e recusa do sexto. O usuário relatou testar e confirmar a recusa do sexto com outra conta. A regra de atraso em produção permanece sem verificação. |
| 005 | CA-06 | NÃO VERIFICADO | Locks e índice único existem, mas não houve teste com transações realmente concorrentes. |
| 005 | CA-08 | PARCIAL | PGlite conferiu isolamento básico; faltam integração Supabase isolada e auditoria completa. |
| 005 | CA-09 | PARCIAL | A tela credita Pixabay e o manifesto registra licenças; não foi feita nesta rodada revisão jurídica de cada imagem. |
| Front 006 | CA-01, CA-02 | PARCIAL | Login do professor e catálogo foram observados; casos de falha, busca e filtros não foram todos reexecutados nesta rodada. |
| Front 006 | CA-03, CA-04 | PARCIAL | O usuário relatou teste com outra conta; não há evidência detalhada de cada recusa e concorrência. |
| Front 006 | CA-05 | PARCIAL | `e98ab75` apresenta as duas datas; `5a8016d` impede atualização de sessão antiga. Revisão estática confirmou a correção, sem testar isolamento do backend ou exibição visual com empréstimo ativo. |
| Front 006 | CA-06 | PASSOU em análise estática | `src/App.tsx` apresenta o crédito Pixabay no catálogo e na lista com imagens. |
| Front 006 | CA-07 | PARCIAL | A sessão fica em memória e há estados de erro e carregamento; a rodada independente não comprovou integralmente ausência de segredos e recarga. |

Na rodada local do responsável pelo trabalho, Jest: 11 aprovados e uma integração ignorada. `test/pglite-isolated-check.mjs`: migrations, carga fictícia, reexecução, rollback, prazo, limite, manutenção e isolamento básico passaram. PGlite não substitui Supabase de teste nem concorrência real. Nenhuma dessas evidências autoriza marcar como aprovado um critério não verificado.
