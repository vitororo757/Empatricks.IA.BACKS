# Carga manual — pendente de imagens e ambiente

Não execute no banco do deploy até ter fotos e URLs públicas reais. O agente não realiza upload nem grava em produção. O operador deve seguir a skill de imagens, verificar cada licença, preparar 12 imagens distintas e 800×600, fazer upload manual e verificar cada URL. Registre por patrimônio URL pública, link da foto Pixabay, autor, licença e resultado da revisão. Não aceite fotos com pessoas, marcas legíveis, textos ou telas com conteúdo.

O responsável deve criar a conta solicitada em Supabase Auth e definir a senha pelo fluxo administrativo seguro. Nunca inclua a senha em arquivos, scripts ou histórico; não altere uma conta existente nem apague seus empréstimos para repetir a carga. A carga não cria empréstimos.

Depois de aplicar migrations revisadas pelo procedimento do projeto, use uma transação no banco autorizado e faça UPSERT por `equipment.asset_tag` com os dados abaixo e URLs verificadas. Antes de atualizar, verifique que nenhum item afetado possui empréstimo ativo ou outra situação conflitante; se houver, interrompa e revise, sem sobrescrever estados. Confirme integridade e faça COMMIT somente após conferir contagens e URLs; caso contrário, ROLLBACK. Isso é uma orientação operacional, não uma execução ou uma evidência de produção.

| Patrimônio | Nome | Categoria | Estado inicial |
|---|---|---|---|
| TI-0001 | Notebook 14 polegadas | notebook | available |
| TI-0002 | Notebook 15 polegadas | notebook | available |
| TI-0003 | Notebook 13 polegadas | notebook | available |
| TI-0004 | Notebook 15 polegadas | notebook | maintenance |
| TI-0005 | Monitor 24 polegadas | monitor | available |
| TI-0006 | Monitor 27 polegadas | monitor | available |
| TI-0007 | Monitor 22 polegadas | monitor | maintenance |
| TI-0008 | Cabo HDMI 2 m | cabo | available |
| TI-0009 | Cabo USB-C 1 m | cabo | available |
| TI-0010 | Cabo de rede 3 m | cabo | maintenance |
| TI-0011 | Webcam Full HD | camera | available |
| TI-0012 | Câmera compacta | camera | available |

Verifique 12 patrimônios únicos, uma imagem diferente por item, URLs públicas, estados escolhidos e zero empréstimos para a conta de avaliação; repita a operação e verifique novamente a contagem. Teste empréstimos usando outra conta. Não afirme que o sistema de produção está pronto antes de fazer essas verificações.

O arquivo `supabase/carga-manual.sql` recebe manualmente um CSV com cabeçalho `patrimonio,url` e as 12 URLs finais. Ele valida valores e aborta na presença de empréstimo ativo antes do UPSERT transacional. A revisão das imagens, URLs e licença continua sendo responsabilidade humana; o script não as verifica pela rede. O manifesto local da skill fica em `imagens-trabalho/prontas/manifesto.json` e registra a origem; ele não deve ser confundido com o CSV das URLs após o upload.

O CSV precisa chamar-se `urls.csv` e estar no diretório corrente de onde o comando psql é executado.
