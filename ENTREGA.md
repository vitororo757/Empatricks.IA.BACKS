# Entrega da prática — em revisão

Este documento reúne o que foi feito e os pontos ainda não comprovados. Não representa aprovação integral das specs. Última atualização: 11/11/2026.

## Links

- Backend: https://github.com/vitororo757/Empatricks.IA.BACKS
- Frontend: https://github.com/vitororo757/Empatricks.IA.FRONT
- Aplicação: https://empatricks-ia.vercel.app
- Prova do verificador: ramificação `prova-verificador` no backend.

## 1. Conflitos

| Pedido | Conflito ou alternativa | Decisão e motivo | Evidência / commit |
|---|---|---|---|
| Fotos Pexels e crédito na tela | O usuário determinou Pixabay posteriormente | Usar Pixabay, registrar fonte e mostrar crédito. É uma alteração expressa do enunciado, não conformidade literal com Pexels. | `docs/specs/004-dados-iniciais/spec.md`; front `83dc7b4` |
| TI-0010 disponível em parte do briefing | Lista fixa informa manutenção | Adotada a lista fixa: TI-0004, TI-0007 e TI-0010 em manutenção. | Specs 004 e 005; backend `91df5e1` |
| Cinco empréstimos e 14 dias úteis | Spec histórica 002 falava em três e 14 dias corridos | Mudança explícita para cinco e 14 dias de segunda a sexta. | Spec 005 e migration `20261111000000_practice_loans.sql`; backend `91df5e1` |
| Senha no arquivo de dados | Regra de não versionar credenciais | Conta criada no Auth sem registrar senha no repositório. | Spec 004; `supabase/CARGA-MANUAL.md` |
| Verificador corrigir testes | Independência de quem verifica | Falha retorna ao agente principal; não se comprovou que essa limitação seja imposta tecnicamente no ambiente. | `docs/verificador-spec.md`; backend `91df5e1` |
| Escrita pelo agente no banco e Storage | Enunciado previa execução pelo responsável | O usuário autorizou expressamente a execução e o bucket público. A exceção e sua divergência em relação ao enunciado ficam registradas aqui. | Spec 004; créditos em `docs/creditos-imagens.json` |

O enunciado menciona `docs/PRD.md` e `rules/`; não foram encontrados nos checkouts inspecionados. Não afirmamos revisão de arquivos ausentes. A spec histórica de health 001 previa independência do banco; o backend atual inicializa Prisma e exige `DATABASE_URL`, portanto essa propriedade histórica não está mantida.

## 1b. Lacunas e decisões

| Spec | Lacuna e alternativas | Decisão registrada e razão | Evidência |
|---|---|---|---|
| 004 | Reexecutar carga: sobrescrever estado ou interromper | Interromper em divergências para proteger empréstimos existentes. | Spec 004 e `supabase/carga-manual.sql`; backend `91df5e1` |
| 005 | Contagem de dias e feriados | Segunda a sexta, sem excluir feriados, a partir do dia seguinte; não havia calendário especificado. | Spec 005 e migration da prática; backend `91df5e1` |
| 005 | Fuso e atraso | America/Sao_Paulo; vencimento no dia corrente ainda não é atraso. | Spec 005 e teste PGlite; backend `91df5e1` |
| 006 | Erro de rede versus lista vazia | Não afirmar que a lista está vazia quando a consulta falha. | Front `9d3abac` |

## 2. Onde o agente tentou decidir

O agente inicialmente propôs cinco empréstimos e 14 dias úteis sem resolver formalmente o conflito com a spec anterior. O conflito foi registrado; a autorização geral do usuário orientou a continuidade, mas não há evidência de que ele tenha avaliado pessoalmente cada alternativa. A troca para Pixabay, por outro lado, foi uma instrução explícita posterior do usuário.

## 3. Decisão e ADR

O calendário poderia usar feriados oficiais ou apenas segunda a sexta. Optou-se pela segunda opção na spec, sem criar um novo ADR: a regra de prazo é domínio da funcionalidade e não foi demonstrada como decisão arquitetural transversal. A alternativa permanece defensável, dependendo da jurisdição e de um calendário acordado.

## 4. Skill de imagens

`.agents/skills/imagens-equipamentos/SKILL.md` define quando usar e as restrições; `references/processo.md` explica o procedimento; `scripts/buscar.mjs` e `scripts/preparar.ps1` automatizam busca, validações e preparação. O processo valida IDs, patrimônios, dimensões e hashes, mas não comprova sozinho ausência de pessoas, marcas, texto ou telas: revisão visual é necessária. A primeira revisão documentada rejeitou 31 de 32 candidatas por esses motivos ou inadequação; novas buscas permitiram preparar 12 arquivos. A imagem TI-0011 é uma câmera de videoconferência ilustrativa, sem prova de ser o modelo exato.

Os 12 créditos estão em `docs/creditos-imagens.json`. As fotos foram preparadas em 800×600, enviadas ao bucket público e as URLs acessadas anteriormente. O script de preparação não inclui upload; porém o ambiente do agente tem acesso compartilhado e **não impede tecnicamente** envio a produção. O usuário autorizou a operação de envio efetuada. Repetir o upload pelo comando usado retornou conflito 409, sem criar cópias; falta comprovar um processo completo automaticamente idempotente.

## 5. Subagente verificador

`AGENTS.md` e `docs/verificador-spec.md` exigem que a revisão leia specs, código e testes com contexto limpo, compare critérios em tabela e não corrija a própria falha. As revisões são solicitadas pelo agente principal, abrangendo ambos os repositórios. O gatilho automático ainda não foi implementado: a regra textual, sozinha, depende de alguém acioná-lo. Os subagentes compartilham as permissões do ambiente, portanto não há garantia técnica de impedir publicação, migrations ou acesso a credenciais. Um ambiente separado e somente leitura é necessário para comprovar essa proteção.

## 6. Verificador em ação

A revisão encontrou que a tela não mostrava a data de retirada recebida do backend (front 006 CA-05). O principal corrigiu em `e98ab75`; compilação TypeScript e Vite passaram. Outra rodada apontou possível resultado de uma sessão antiga aparecer após troca de conta; o front `5a8016d` condiciona a atualização à sessão atual, e nova leitura estática não encontrou essa falha. Outra falha real foi a inicialização do guard na API: o deploy reportou dependências não resolvidas e o backend `f9ae427` corrigiu o problema; os testes locais do backend passaram.

A prova em ramificação separada introduziu, em `32f350f`, uma recusa indevida do quinto empréstimo. Um revisor com contexto limpo identificou **CA-05 FALHOU**; `e5106d8` desfez o erro. Na nova rodada o mesmo critério **passou em análise estática**. Outros critérios permaneceram não verificados. Tabelas comparáveis e limites constam de `docs/revisao-pratica.md`.

Em teste local isolado, Jest registrou 11 testes aprovados e uma integração ignorada. O script PGlite aplicou migrations com dados fictícios e verificou carga, prazo, limite, manutenção, isolamento básico e rollback. Isso não substitui Supabase de teste, concorrência real ou confirmação das fotos reais.

## 7. Regra posta à prova

Uma instrução textual para o revisor não escrever não é controle de segurança. O protocolo passou a distinguir a orientação da proteção efetiva necessária: ambiente sem segredos, com arquivos somente leitura e rede restrita. Essa segregação e o gatilho automático continuam pendentes.

## 8. Fora do escopo ou pendente

- Testes de concorrência real, atraso e integração Supabase em ambiente descartável; o teste de integração ignorado não deve ser apontado para produção.
- O usuário relatou ter testado empréstimos com outra conta e confirmado a recusa do sexto. A conta do professor foi reconferida em 11/11/2026 e apresentou zero empréstimos. O relato não substitui uma gravação ou execução independente de todos os passos.
- Revisão técnica independente e isolada com prova de impossibilidade de publicação; aprovação por critério não pode ser inferida das instruções textuais.
- Reexecução automática e idempotente do envio das imagens, além da revisão da adequação da imagem ilustrativa da webcam.
- Conferir a versão publicada da data de retirada, completar as tabelas de verificação com evidência e marcar a entrega com a tag `entrega-pratica` em ambos os repositórios no momento apropriado.
