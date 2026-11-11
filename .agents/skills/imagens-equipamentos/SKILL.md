---
name: imagens-equipamentos
description: Preparar fotos Pixabay revisadas de equipamentos para o catálogo de empréstimos. Não usar para logos, ilustrações ou outras imagens.
---

# Imagens de equipamentos

Use apenas a API Pixabay, conforme mudança expressa pelo usuário em relação ao enunciado. Leia `references/processo.md` antes de começar. Execute `scripts/buscar.mjs` para obter candidatos e `scripts/preparar.ps1` após revisão visual individual. Não aprove automaticamente: rejeite qualquer pessoa, marca ou logotipo legível, texto, tela com conteúdo ou equipamento incorreto, inclusive em reflexos. Registre cada reprovação e motivo. Na dúvida, rejeite.

Cada patrimônio deve ter exatamente uma foto distinta. O resultado local deve conter imagens JPEG 800×600 e manifesto de origem, fotógrafo e licença. A validação automatizada não substitui a revisão visual. Só imagens aprovadas podem seguir para o sistema. A interface deve mostrar um link visível “Fotos: Pixabay”.

Não envie, publique ou escreva imagens no Storage ou banco de produção. O usuário executa a publicação por conta própria. Não guarde chaves no código, manifesto ou git. Se faltar chave, credenciais ou aprovação visual, pare e informe o que está pendente.
