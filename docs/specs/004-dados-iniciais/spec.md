# Spec 004 — Dados iniciais de equipamentos

## Objetivo e escopo
Preparar uma carga reproduzível dos 12 equipamentos da lista do enunciado, com uma imagem Pixabay aprovada por equipamento e a conta de avaliação. O enunciado prevê execução manual pelo responsável; posteriormente, o usuário autorizou expressamente o agente a concluir a parte de banco. O envio de imagens permanece pendente. Não importar planilha nem criar empréstimos.

## Decisões e conflitos
- A lista fixa identifica TI-0004, TI-0007 e TI-0010 em manutenção; o briefing posterior diz apenas os dois primeiros. Adota-se a lista fixa porque determina explicitamente os dados comuns da prática. As demais nove unidades ficam disponíveis.
- O enunciado original cita Pexels; o usuário alterou explicitamente a origem para Pixabay. A proveniência/licença de cada arquivo precisa ser conservada e verificada conforme as condições da Pixabay.
- A senha solicitada não é incluída em código, seed, histórico, logs ou documentação. A criação da conta e a definição da senha devem ser feitas manualmente pelo responsável em Supabase Auth, fora do agente. A conta começa sem empréstimos; uma repetição não deve apagar empréstimos existentes nem redefinir senha.
- O brief sugere instalar sharp, mas a política de dependências pede conferir o ADR antes de instalar; a padronização deve ser garantida pela skill e suas ferramentas autorizadas. Não prometer arquivo 800×600 sem conferir o resultado real.
- A situação de item já emprestado não deve ser sobrescrita ao repetir a carga. A carga deve fazer upsert pelo patrimônio único e falhar de forma explícita se houver conflito entre o estado real e a situação desejada, sem recriar ou encerrar empréstimos.
- A URL da foto somente será gravada após upload manual ao bucket público e validação do endereço, arquivo, dimensões, licença e revisão visual. Não usar imagens fictícias enquanto as fotos não estiverem prontas.
- O usuário autorizou concluir a parte de banco e deixar fotos pendentes. Os equipamentos podem ser carregados parcialmente com `image_url` nula via `supabase/carga-inicial-sem-fotos.sql`, sem declarar a spec concluída; a carga integral continua condicionada às imagens revisadas.

## Critérios de aceitação
- CA-01: Exatamente os 12 patrimônios TI-0001 a TI-0012 existem uma única vez, com nomes e categorias da lista fixa.
- CA-02: TI-0004, TI-0007 e TI-0010 estão em manutenção; os outros nove disponíveis quando não houver empréstimos.
- CA-03: Cada item possui uma imagem distinta, aprovada, sem pessoas, marcas legíveis, texto ou conteúdo em telas; cada uma mede 800×600 e tem fonte, autor e licença registrados.
- CA-04: Cada URL pública abre sem autenticação; a atribuição requerida por Pixabay é considerada no produto conforme as condições de uso aplicáveis.
- CA-05: Conta solicitada pode autenticar e não recebe empréstimos durante a carga. Credenciais são fornecidas manualmente fora do repositório.
- CA-06: Reexecução não duplica registros e não altera empréstimos ativos; falhas não resultam em uma carga parcial.
- CA-07: A aplicação no deploy respeita a autorização vigente do responsável e uma validação de produção exige evidência real. O enunciado original previa execução pelo próprio responsável; a exceção para a parte de banco foi concedida expressamente pelo usuário.

## Verificação e operação
A carga e autenticação dependem de ambiente Supabase, conta de operador, fotos revisadas e URLs públicas reais. Consulte `supabase/CARGA-MANUAL.md`. Até a realização desses passos, os critérios de produção permanecem não verificados.
