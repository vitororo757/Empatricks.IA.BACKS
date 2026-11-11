# Protocolo do verificador de specs

Antes de declarar uma spec pronta, o agente principal deve criar um subagente com contexto limpo e solicitar a conferência de cada critério. Na chamada, informe somente os caminhos das specs, ADRs, código, testes e os dois repositórios relevantes; não sugira conclusões. O revisor deve ler esses arquivos por conta própria e não editar, corrigir, publicar, migrar nem usar credenciais de produção. Se não for possível delegar, o resultado permanece pendente.

Use a mesma tabela em todas as rodadas para permitir comparação:

| Spec | Critério | Resultado (PASSOU/FALHOU/NÃO VERIFICADO) | Evidência (arquivo, teste ou observação) | Motivo |
|---|---|---|---|---|

Ausência de evidência é NÃO VERIFICADO, não aprovação. Registre cada rodada e a revisão final; registre falhas corrigidas e os commits reais quando houver. Teste quebrado deve voltar ao agente principal, inclusive quando for a única falha. O agente principal só pode declarar pronta uma spec quando todos os critérios aplicáveis tiverem evidência e a revisão estiver aprovada.

## Limites do ambiente

As instruções não garantem isolamento técnico. Os subagentes nesta sessão compartilham o ambiente e as ferramentas do agente principal; um pedido de apenas leitura não impede uma escrita. Para proteção efetiva, execute uma revisão em ambiente separado, sem credenciais, com acesso somente de leitura aos repositórios e rede restrita. O mecanismo automático de acionamento e o isolamento precisam ser conferidos no harness utilizado; este arquivo, sozinho, não prova nenhum dos dois.
