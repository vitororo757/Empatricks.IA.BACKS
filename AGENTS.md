# Trabalho neste repositório

- Leia a spec pertinente e o ADR da stack antes de implementar. Não declare uma spec pronta sem revisão independente por um subagente, seguindo `docs/verificador-spec.md`.
- A revisão abrange os dois repositórios REST quando o critério depende de ambos. O agente principal corrige as falhas e solicita nova rodada; o verificador não corrige.
- Não aplique migrations nem escreva no banco ou Storage de produção. O usuário executa essas operações. Nunca registre segredos.
- A instrução de revisão é uma regra de processo, não um controle de segurança. Subagentes desta sessão compartilham ambiente e permissões; não disponibilize credenciais de produção ao revisor.
