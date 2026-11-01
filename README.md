# Da Reunião ao Documento: Design Docs Gerados por IA

## Sobre o desafio

O ponto de partida é um Order Management System em produção e a transcrição de uma reunião de cerca de 55 minutos em que tech lead, PM, engenheiros e segurança decidiram criar um Sistema de Webhooks de Notificação de Pedidos. Nada foi registrado além da conversa. Minha tarefa foi transformar essa transcrição e o código existente em um pacote de documentação que permita ao time começar a implementar: PRD, RFC, FDD, ADRs, Tracker de rastreabilidade e este README.

O desafio não é só gerar texto. Tudo precisa ter origem na reunião ou no código, nada pode ser inventado, e o que foi descartado ou adiado não pode virar requisito. A IA fez a produção. Coube a mim definir as regras, o método e a ordem, e decidir o que fazer com as ambiguidades. O enunciado original está no [repositório base](https://github.com/devfullcycle/mba-ia-desafio-design-docs-com-ia).

## Ferramentas de IA utilizadas

- **Claude Code, na extensão do VS Code:** ferramenta principal. Explorou o código, analisou a transcrição, escreveu os documentos e fez a verificação mecânica. As etapas 2 a 7 rodaram com o modelo Claude Opus 5.5.
- **Subagentes Explore, do Claude Code:** exploração independente do código na Etapa 1, comparada depois com a leitura direta dos arquivos.
- **Subagentes de auditoria, do Claude Code:** revisão dos documentos prontos, sem o histórico da produção e sem permissão de edição combinada no prompt.

Recursos do Claude Code usados para controlar a produção:

- **`CLAUDE.md`:** regras carregadas em toda sessão, mesmo depois de `/clear`.
- **`.claude/settings.local.json`:** bloqueia edições em `src/`, `prisma/`, `tests/` e `TRANSCRICAO.md`.

## Workflow adotado

Segui uma etapa por vez, escritas em [docs/desafio/prompt_docs.md](docs/desafio/prompt_docs.md). Cada etapa começou por um comando meu, e os documentos posteriores se apoiam nos anteriores.

| Etapa | Saída | Situação |
|---|---|---|
| 1. Contextualização | [trabalho/INVENTARIO.md](trabalho/INVENTARIO.md) | Concluída |
| 2. ADRs | [docs/adrs/](docs/adrs/), 8 arquivos | Concluída |
| 3. RFC | [docs/RFC.md](docs/RFC.md) | Concluída |
| 4. FDD | [docs/FDD.md](docs/FDD.md) | Concluída |
| 5. PRD | [docs/PRD.md](docs/PRD.md) | Concluída |
| 6. Tracker | [docs/TRACKER.md](docs/TRACKER.md), varredura no fim | Concluída |
| 7. README | Este arquivo | Concluída |
| 8. Revisão final contra a checklist | Relatório de auditoria e correções | Concluída |
| 9. Ciclos de revisão crítica | Versões refinadas | Concluída, com 3 ciclos |

Como organizei a interação com a IA:

- **Inventário como fonte de verdade:** a Etapa 1 gerou tabelas de decisões, requisitos, descartes, adiamentos e ambiguidades, relidas no início das etapas seguintes.
- **Ambiguidades decididas fora dos documentos:** a IA listou 17 ambiguidades com recomendação, e eu aceitei as recomendações. O resultado virou inferências com ID (`INF-NN`), nunca atribuídas aos participantes da reunião.
- **Um ciclo por documento:** geração, conferência por script, releitura contra as fontes, correção e registro em [notas-processo.md](notas-processo.md).
- **Prova de que o código não mudou:** `trabalho/checksums-codigo.txt`, conferido ao fim de cada etapa desde a 2.

**Ciclos de iteração:**

1. **Geração, script e releitura de cada documento:** iterações 1 a 12 das notas.
2. **Auditoria independente da Etapa 8:** 14 problemas confirmados e corrigidos (iteração 13).
3. **Revisão crítica da Etapa 9:** alucinações, fronteira entre documentos, descartado × adiado × decidido, genericidade e leitura do FDD como implementador (iteração 14).

Os dois últimos ciclos corrigiram só os erros confirmados. Os itens discutíveis vieram para mim, que aceitei as recomendações da IA para alguns e deixei os demais como estavam (iteração 15).

## Prompts customizados

Adaptei estes prompts a partir do material do curso. Os trechos são literais. Os prompts completos estão em [docs/desafio/prompt_docs.md](docs/desafio/prompt_docs.md).

**Regras permanentes, no `CLAUDE.md` (trecho).** Elas são o principal controle contra alucinação:

```text
- R1. Toda afirmação (requisito, decisão, restrição, métrica, risco) deve ter
  origem identificável: `[hh:mm] Nome` da transcrição OU caminho real de arquivo.
- R2. Se algo não está na transcrição nem no código, NÃO escreva. Se for
  indispensável para a coerência do documento, marque como
  `> ⚠️ Inferência (sem fonte direta): ...` e liste ao final para revisão humana.
- R3. Antes de citar um arquivo do código, confirme que ele existe (liste/abra).
  Nunca cite caminho, classe ou método que você não viu.
- R4. Diferencie com rigor: DECIDIDO × DESCARTADO × ADIADO × EM ABERTO ×
  DETALHE SECUNDÁRIO. Nem tudo que foi falado vira requisito.
```

**Inventário da Etapa 1 (trecho).** Pede uma filtragem dirigida, em vez de um resumo genérico da reunião:

```text
Parte C — INVENTÁRIO em tabelas (não escreva os docs ainda):

A) Decisões fechadas — | # | Decisão | Quem/quando ([hh:mm] Nome) | Justificativa citada |
B) Requisitos funcionais explícitos — | # | Requisito | Fonte |
C) Requisitos não funcionais / restrições (segurança, latência, volume,
   timeouts, retenção, etc.) — | # | Item | Valor citado | Fonte |
D) Alternativas DESCARTADAS — | # | Alternativa | Motivo do descarte (trade-off) | Fonte |
E) Itens ADIADOS para fases futuras — | # | Item | Fonte |
F) Questões EM ABERTO / não decididas — | # | Questão | Quem levantou | Fonte |
```

**ADRs da Etapa 2 (trecho).** Define o limite do que vira decisão e a independência de cada ADR:

```text
Obrigatório cobrir no mínimo 5 das 6 decisões principais (idealmente as 6).
Decisões secundárias (formato de payload, timeouts, headers) só viram ADR
se houver discussão real de alternativas na transcrição.
```

```text
- ADRs são independentes: cada um se lê sozinho, sem repetir detalhes de
  implementação que pertencem ao FDD.
```

## Iterações e ajustes

O [notas-processo.md](notas-processo.md) registra 15 correções. As principais:

| Documento | O que estava errado | Como foi detectado | Correção |
|---|---|---|---|
| Inventário | O primeiro inventário foi gerado sem exploração independente e faltavam a lista de falantes, os caminhos confirmados e fatos do código | Comparação com os relatórios dos subagentes | Reescrevi o prompt para o Claude Code, com `CLAUDE.md`, bloqueio de edição e checksums, e o inventário foi refeito |
| Inventário | A IA anunciou que resolveria sozinha ambiguidades da reunião, como o significado de "5 tentativas" | Releitura do prompt ajustado | As ambiguidades passaram a ser listadas para decisão humana |
| ADRs | Citava como falas de Marcos e Sofia os registros de saída da call, às 09:50 | Leitura do ADR-007 | Citação trocada por referência a `TRANSCRICAO.md` |
| RFC | Atribuía à secret global a vantagem "mais simples de gerir", que ninguém citou | Releitura contra a transcrição, depois que o script tinha passado | Vantagem removida |
| FDD | Apresentava "5 reenvios" como valor da reunião, que na verdade disse "5 tentativas" | Releitura contra a transcrição | Passou a citar a inferência `INF-01` |
| PRD | Classificava a ordem global como "descartada", quando a reunião a registrou como limitação conhecida | Releitura contra a transcrição | Classificação corrigida |
| Tracker | Lacunas apontavam para falas sobre o comportamento relacionado, parecendo ter sido discutidas | Leitura de uma amostra das linhas | A seção de cobertura passou a explicar o caso |
| Todos | Extrapolações sem marca: revisão da Sofia ampliada além do que `[09:46] Sofia` disse, permissão do CRUD estendida a outros endpoints, secret "só na criação" e meta "3 de 3" | Auditoria em subagente sem o histórico | Marcadas como inferências `INF-38` a `INF-42`, com os textos ajustados |
| FDD | Falhas lógicas: métrica de acúmulo que para quando o worker para, exemplo que contradizia a matriz de erros e `requestId` indisponível no ponto do log | Auditoria em subagente sem o histórico | Fluxo, exemplo e mitigação reescritos |
| FDD | Um erro depois do claim deixava o evento preso em `PROCESSING` até o próximo reinício, sem aparecer nas métricas | Revisão crítica, lendo o FDD como implementador | Comportamento definido, com critério de aceite e risco registrado |

A leitura do código também mostrou pontos que contradizem falas da reunião. O registro público aceita `role: ADMIN`, e `User` não tem vínculo com `Customer`, ao contrário do que `[09:32] Marcos` sugere. Esses pontos entraram como riscos, com a fonte no código e sem proposta de mudança.

O que aprendi com essas correções: os scripts confirmam que uma fala ou um arquivo existem, mas não que sustentam a afirmação. Os erros mais sérios, como a vantagem inventada e a classificação errada, só apareceram na releitura.

**Limites do processo até aqui:**

- Das iterações 5 a 12, as correções vieram da releitura e dos scripts da própria IA, sem ajuste nos prompts. O ajuste veio na auditoria, cujo prompt pede para verificar se a fonte sustenta a afirmação, e não só se ela existe. O auditor não viu a produção, mas ainda é IA revisando IA.
- O mapa de fontes do Tracker foi feito à mão para 82 itens, e 80 deles ficaram ligados à fala ou ao arquivo de origem. Os outros 2 são `RFC-Q-11` e `FDD-LAC-04`, listados como sem fonte. A auditoria acrescentou `RFC-Q-10` a essa lista.

## Como navegar a entrega

**Ordem sugerida de leitura:**

1. [docs/PRD.md](docs/PRD.md): por que e o quê.
2. [docs/RFC.md](docs/RFC.md): a proposta técnica e o que está em aberto.
3. [docs/adrs/](docs/adrs/): por que cada decisão foi tomada.
4. [docs/FDD.md](docs/FDD.md): como construir em detalhe.
5. [docs/TRACKER.md](docs/TRACKER.md): de onde veio cada item.

**ADRs:**

- [ADR-001](docs/adrs/ADR-001-outbox-no-mysql.md): outbox no MySQL
- [ADR-002](docs/adrs/ADR-002-worker-separado-em-polling.md): worker separado em polling
- [ADR-003](docs/adrs/ADR-003-retry-com-backoff-e-dlq.md): retry com backoff e DLQ
- [ADR-004](docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md): HMAC-SHA256 com secret por endpoint
- [ADR-005](docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md): at-least-once com `X-Event-Id`
- [ADR-006](docs/adrs/ADR-006-reuso-dos-padroes-existentes.md): reuso dos padrões do projeto
- [ADR-007](docs/adrs/ADR-007-evento-materializado-na-insercao.md): filtro e snapshot na inserção
- [ADR-008](docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md): controle de acesso

**Material de apoio ao processo:**

- [docs/desafio/prompt_docs.md](docs/desafio/prompt_docs.md): prompts das 9 etapas.
- [trabalho/INVENTARIO.md](trabalho/INVENTARIO.md): inventário e lista das inferências.
- [notas-processo.md](notas-processo.md): registro de cada correção.
- [trabalho/scripts/](trabalho/scripts/): conferência dos documentos e geração do Tracker.

**O que continua sem decisão:** as questões abertas estão no [RFC, seção 6](docs/RFC.md), as lacunas que bloqueiam partes da implementação estão no fim do [FDD](docs/FDD.md) e as 45 inferências estão no fim do [Tracker](docs/TRACKER.md). Aceitei todas, mas nenhuma foi decidida na reunião.
