# Spec 005 — Solicitar empréstimo

## Objetivo
Uma pessoa autenticada consulta o catálogo, pede um equipamento disponível e acompanha apenas seus empréstimos ativos. Solicitar cria o empréstimo imediatamente; aprovação, fila, devolução, notificações e reservas futuras não fazem parte desta entrega.

## Decisões e conflitos
- O briefing novo pede limite de cinco ativos e prazo de 14 dias úteis; a spec anterior de schema dizia três e 14 dias corridos. Adotam-se cinco e dias úteis para este exercício, sem reescrever a história da spec anterior. A migration posterior substitui as regras para novos empréstimos; empréstimos históricos não mudam.
- Dia útil aqui é segunda a sexta, excluindo sábados e domingos. Feriados foram deixados fora por ausência de calendário e jurisdição definida. Conta-se a partir do dia seguinte à solicitação. Datas de referência e atraso usam o fuso America/Sao_Paulo; vencimento hoje não é atraso. A data é apresentada como dia de calendário, não como instante.
- Em caso de conflito com a lista que define as situações iniciais, TI-0010 também começa em manutenção, conforme spec 004.
- As regras de limite, atraso, concorrência e disponibilidade são aplicadas no banco; bloqueio por usuário e linha de equipamento serializam pedidos concorrentes e o índice único evita dois empréstimos ativos do mesmo item. A API propaga identidade verificada para RLS.
- Origem das imagens alterada de Pexels para Pixabay por instrução explícita do usuário; conservar eventual atribuição exigida pelas condições de uso em vez de omiti-la quando obrigatória.

## Critérios de aceitação
- CA-01: Com token válido o catálogo retorna imagem, nome, categoria e situação; sem autenticação recebe recusa.
- CA-02: Só equipamento disponível pode ser solicitado; manutenção e empréstimo existente são recusados com motivo compreensível.
- CA-03: Solicitação válida cria imediatamente um único empréstimo ativo e muda o estado do equipamento para emprestado na mesma transação.
- CA-04: O prazo é 14 dias úteis, contados após o dia da solicitação, com a convenção e fuso acima.
- CA-05: Quem já possui cinco empréstimos ativos ou qualquer empréstimo com data anterior a hoje recebe recusa com motivo visível.
- CA-06: Duas solicitações simultâneas pelo mesmo item geram no máximo um empréstimo ativo; solicitações simultâneas pelo mesmo usuário respeitam o limite.
- CA-07: Meus empréstimos lista somente os ativos da identidade autenticada, com data de vencimento e equipamento.
- CA-08: RLS continua ativa; o cliente não escolhe o solicitante nem edita vencimento, e credenciais não são armazenadas em código.
- CA-09: A página fornece atribuição ao provedor quando exigida pelas condições aplicáveis. Não se declara conformidade sem verificação da licença das fotos selecionadas.

## Contrato REST
`GET /equipment`; `GET /loans`; `POST /loans` com `{ "equipmentId": "uuid" }`. As três rotas exigem Bearer JWT validado pelo Supabase Auth. Erros de regra respondem 409 com campo `message`; uma entrada inválida recebe 400. A identidade e os claims confiáveis são definidos pelo backend.

## Verificação
Os testes SQL devem exercitar isolamento RLS, status, limite e cálculo do prazo; concorrência, atraso e falhas devem ser exercitados em banco Supabase de teste. A aplicação em produção e sua validação permanecem pendentes até o responsável executá-las.
