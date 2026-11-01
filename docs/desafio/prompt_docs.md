# Prompt mestre: Geração do pacote de Design Docs (Webhooks de Notificação de Pedidos)

> **Como usar:** este arquivo foi escrito para o **Claude Code**, rodando na raiz do repositório (onde este arquivo está). O **contexto global** (seção 0) vira o `CLAUDE.md` do projeto, carregado automaticamente em toda sessão. As **9 etapas** seguem a ordem de execução do desafio: rode uma por vez, colando o prompt ou usando comandos `/etapa-N`, e revise os arquivos gerados antes de seguir. Não peça tudo de uma vez: o desafio espera de 3 a 5 ciclos de geração → revisão → ajuste.

## Ordem de execução

| Etapa | O que fazer | Saída | Depende de |
|---|---|---|---|
| 1. Contextualização com IA | Dar à IA acesso ao código e à transcrição; exploração inicial de estrutura, padrões e do que a feature precisa endereçar | Inventário (rascunho de trabalho) | — |
| 2. ADRs primeiro | Identificar e registrar as decisões principais; elas são o esqueleto do "como implementar" | `docs/adrs/ADR-NNN-*.md` | 1 |
| 3. RFC | Consolidar a proposta técnica sobre as decisões; alternativas descartadas e questões em aberto entram aqui; referenciar os ADRs já escritos | `docs/RFC.md` | 1, 2 |
| 4. FDD | Construir o desenho técnico sobre decisões e proposta; incluir a seção obrigatória "Integração com o sistema existente" | `docs/FDD.md` | 2, 3 |
| 5. PRD | Último dos grandes documentos; com ADRs, RFC e FDD em mãos vira uma consolidação em nível de produto | `docs/PRD.md` | 2, 3, 4 |
| 6. Tracker | Montar em paralelo (incremental, após cada etapa 2–5) ou no fim, varrendo os documentos prontos | `docs/TRACKER.md` | 2–5 |
| 7. README do processo | Por último, quando o processo já está completo e pode ser documentado com clareza | `README.md` | 1–6 |
| 8. Revisão final | Checklist de critérios de aceite item por item antes da entrega | Relatório de auditoria + correções | 1–7 |
| 9. Iterar | 3 a 5 ciclos de geração → revisão crítica → ajuste de prompt → nova geração. Gerou tudo de primeira? Provavelmente está genérico demais | Versões refinadas + notas de iteração | Todas |

> A etapa 9 não é só o fim: ela atravessa o processo. Rode os prompts de revisão crítica da Etapa 9 ao concluir cada documento, e anote cada correção em `notas-processo.md` (vira a seção "Iterações e ajustes" do README).

---

## Preparação no Claude Code (uma vez, antes da Etapa 1)

1. **Abra o Claude Code na raiz do repositório**, a mesma pasta onde estão `TRANSCRICAO.md`, `src/` e este arquivo.
2. **Crie o `CLAUDE.md`** na raiz com o conteúdo do bloco da seção 0. Assim as regras valem em toda sessão, inclusive depois de `/clear`. Se o repositório já tiver um `CLAUDE.md`, acrescente o bloco ao final.
3. **Bloqueie edições no código.** A entrega é só documental. Crie `.claude/settings.local.json`:
   ```json
   {
     "permissions": {
       "deny": [
         "Edit(src/**)", "Write(src/**)",
         "Edit(prisma/**)", "Write(prisma/**)",
         "Edit(tests/**)", "Write(tests/**)",
         "Edit(TRANSCRICAO.md)", "Write(TRANSCRICAO.md)"
       ]
     }
   }
   ```
4. **Crie a estrutura de trabalho:** `docs/adrs/`, `trabalho/` (inventário e rascunhos, fora de `docs/`) e `notas-processo.md`.
   Registre também uma "foto" do código para provar no fim que nada foi alterado:
   ```bash
   find src prisma tests TRANSCRICAO.md -type f -exec sha256sum {} + > trabalho/checksums-codigo.txt
   ```
5. **(Opcional) Transforme as etapas em comandos.** Salve o bloco de prompt de cada etapa em `.claude/commands/etapa-1.md` … `etapa-9.md` e chame com `/etapa-1`, `/etapa-2` etc. Assim os prompts ficam versionados e reaproveitáveis, o que também alimenta a seção "Prompts customizados" do README.

**Rotina por etapa**

| Momento | O que fazer no Claude Code |
|---|---|
| Início | `/clear` para liberar o contexto (o `CLAUDE.md` continua valendo). Referencie entradas com `@`, ex.: `@TRANSCRICAO.md`, `@trabalho/INVENTARIO.md`, `@docs/adrs/` |
| Etapa 1 | Comece em **plan mode**, só leitura, para explorar sem escrever nada |
| Durante | Aprove as escritas apenas em `docs/`, `trabalho/`, `README.md` e `notas-processo.md` |
| Fim | Revise os arquivos gerados, rode os prompts de revisão crítica (Etapa 9) e registre em `notas-processo.md` o que foi gerado e o que precisou de ajuste |

O `notas-processo.md`, preenchido etapa a etapa, é a evidência para a seção "Iterações e ajustes" do README.

---

## 0. Contexto global → conteúdo do `CLAUDE.md`

```text
Você é um Staff Engineer responsável por documentar uma feature a partir de
uma reunião técnica já realizada. Seu trabalho é EXTRAIR e ORGANIZAR, não criar.

## Cenário
Uma empresa opera um Order Management System (OMS) em produção:
Node.js + TypeScript, MySQL via Prisma. Módulos: auth, users, customers,
products, orders. O pedido tem máquina de estados controlada, controle
transacional de estoque e auditoria de mudanças de status.
A aplicação NÃO possui notificação externa, eventos, filas ou webhooks.

A feature é um "Sistema de Webhooks de Notificação de Pedidos". A decisão
técnica foi tomada em uma reunião (tech lead, PM, engenheiros, segurança),
registrada apenas em TRANSCRICAO.md, no formato `[hh:mm] Nome: fala`.

## Fontes permitidas (e somente estas)
1. TRANSCRICAO.md  → decisões, requisitos, restrições, descartes, adiamentos
2. Código do repositório (src/, prisma/, tests/, configs) → padrões,
   caminhos de arquivo, classes de erro, serviços, schema

## Regras inegociáveis
- R1. Toda afirmação (requisito, decisão, restrição, métrica, risco) deve ter
  origem identificável: `[hh:mm] Nome` da transcrição OU caminho real de arquivo.
- R2. Se algo não está na transcrição nem no código, NÃO escreva. Se for
  indispensável para a coerência do documento, marque como
  `> ⚠️ Inferência (sem fonte direta): ...` e liste ao final para revisão humana.
- R3. Antes de citar um arquivo do código, confirme que ele existe (liste/abra).
  Nunca cite caminho, classe ou método que você não viu.
- R4. Diferencie com rigor: DECIDIDO × DESCARTADO × ADIADO × EM ABERTO ×
  DETALHE SECUNDÁRIO. Nem tudo que foi falado vira requisito.
- R5. Não altere nada em src/, prisma/, tests/ ou configurações. A entrega é
  puramente documental, em Markdown, em português.
- R6. Cada documento opera numa altura diferente. Não duplique conteúdo:
  PRD = por quê/o quê | RFC = como pretendemos e o que está aberto |
  ADR = por que decidimos assim | FDD = como construir em detalhe |
  TRACKER = de onde veio cada coisa.
- R7. Atribua a cada item um ID estável (ex.: PRD-FR-01, RFC-ALT-02,
  FDD-CONTRATO-03, ADR-002) já no momento da escrita — o tracker depende disso.

## Ordem de execução (siga estritamente; uma etapa por vez)
1. Contextualização (exploração do código + transcrição → inventário)
2. ADRs
3. RFC (referenciando os ADRs já escritos)
4. FDD (sobre ADRs + RFC; com "Integração com o sistema existente")
5. PRD (consolidação em nível de produto)
6. Tracker (incremental após cada etapa 2–5, ou varredura no fim)
7. README do processo
8. Revisão final contra a checklist de aceite
9. Iteração: revisão crítica e regeneração (3 a 5 ciclos no total)
Não antecipe etapas: ao terminar uma, pare e aguarde revisão antes da próxima.
Documentos de etapas posteriores devem se apoiar nos anteriores, não o contrário.

## Como trabalhar neste repositório (Claude Code)
- Escreva SOMENTE em: docs/, trabalho/, README.md, notas-processo.md.
  Nunca edite src/, prisma/, tests/, TRANSCRICAO.md nem configurações.
- Leia antes de afirmar: use Read/Grep/Glob para confirmar cada arquivo,
  classe e método antes de citá-lo.
- O inventário da Etapa 1 fica em trabalho/INVENTARIO.md e é a fonte de
  verdade das etapas seguintes; releia-o no início de cada etapa.
- Ao terminar uma etapa: liste os arquivos criados/alterados, os itens
  marcados ⚠️ Inferência e pare.
```

---

## Etapa 1 — Contextualização com IA (exploração inicial; não gera documento final)

Rode em **plan mode**, que é só leitura. Depois de revisar a exploração, saia do plan mode e peça para gravar o inventário em `trabalho/INVENTARIO.md`.

```text
ETAPA 1 de 9 — Contextualização. Entradas: @TRANSCRICAO.md e o repositório.

Parte A — Exploração do código. Use subagentes Explore em paralelo (um para
a estrutura geral e padrões transversais, outro para o módulo de pedidos e
o schema Prisma) e depois abra você mesmo os arquivos-chave. Descreva:
- Estrutura de pastas e organização dos módulos (auth, users, customers,
  products, orders)
- Padrões recorrentes: camadas (rotas/controllers/services/repositories),
  validação, tratamento de erros (classes de erro, middleware), logger,
  configuração de env, uso de transações Prisma, testes
- O ciclo de vida do pedido: máquina de estados, método que muda status,
  controle de estoque, auditoria de mudanças de status
- prisma/schema.prisma: modelos relevantes para a feature
- O que NÃO existe hoje (eventos, filas, notificação externa) e onde a
  feature precisaria se encaixar
Cite o caminho de cada arquivo que abrir.

Parte B — Leitura da transcrição. Leia TRANSCRICAO.md integralmente e
resuma, em 10 linhas, o que a feature precisa endereçar e quem decidiu o quê.

Parte C — INVENTÁRIO em tabelas (não escreva os docs ainda):

A) Decisões fechadas — | # | Decisão | Quem/quando ([hh:mm] Nome) | Justificativa citada |
B) Requisitos funcionais explícitos — | # | Requisito | Fonte |
C) Requisitos não funcionais / restrições (segurança, latência, volume,
   timeouts, retenção, etc.) — | # | Item | Valor citado | Fonte |
D) Alternativas DESCARTADAS — | # | Alternativa | Motivo do descarte (trade-off) | Fonte |
E) Itens ADIADOS para fases futuras — | # | Item | Fonte |
F) Questões EM ABERTO / não decididas — | # | Questão | Quem levantou | Fonte |
G) Detalhes técnicos secundários (formato de payload, headers, timeouts,
   nomes de eventos, status) — | # | Detalhe | Fonte |
H) Ganchos com o código — | Ponto citado na reunião | Arquivo real | Método/classe real |
I) Métricas de sucesso com números citados — | Métrica | Meta | Fonte |

Confirme especificamente se a transcrição cobre estas 6 decisões e onde:
1. Padrão Outbox no MySQL
2. Retry com backoff + DLQ
3. HMAC-SHA256 com secret por endpoint
4. At-least-once com X-Event-Id
5. Worker em processo separado, em polling
6. Reuso dos padrões existentes do projeto

Para a seção H, liste os caminhos de arquivo EXISTENTES que você abriu
(ex.: o service de pedidos com o método changeStatus, as classes de erro,
o schema Prisma, o app/server, o logger). Não invente.

Ao final, liste ambiguidades que precisam de decisão humana.

Saída: grave as partes A, B e C em trabalho/INVENTARIO.md (fora de docs/).
Inclua uma lista de todos os falantes da transcrição com seus papéis e uma
lista dos caminhos de arquivo confirmados, que serão reusadas nas etapas.
```

**Revisão humana obrigatória:** confira 5–10 timestamps por amostragem e todos os caminhos de arquivo. Corrija o inventário antes de seguir — ele é a base de tudo.

---

## Etapa 2 — ADRs primeiro (`docs/adrs/`)

As decisões formam o esqueleto do "como implementar"; todos os documentos seguintes vão se apoiar nelas.

```text
ETAPA 2 de 9 — ADRs. Entradas: @trabalho/INVENTARIO.md (revisado) e
@TRANSCRICAO.md para conferir as falas citadas.

Gere entre 5 e 8 ADRs, um arquivo por
decisão, nomeados `docs/adrs/ADR-NNN-titulo-em-kebab-case.md`.

Obrigatório cobrir no mínimo 5 das 6 decisões principais (idealmente as 6).
Decisões secundárias (formato de payload, timeouts, headers) só viram ADR
se houver discussão real de alternativas na transcrição.

Formato MADR, seções obrigatórias:

# ADR-NNN: <Título>
- **Status:** Aceito | Proposto | ... (use o que a reunião indica)
- **Data:** <data>
- **Decisores:** <participantes que decidiram, conforme transcrição>
- **Fontes:** [hh:mm] Nome, [hh:mm] Nome, <caminho/de/arquivo>

## Contexto
Problema e forças em jogo, citando falas da reunião e o estado do código.

## Decisão
O que foi decidido, de forma objetiva e verificável.

## Alternativas Consideradas
Pelo menos 1 alternativa real discutida (ou plausível, marcada como tal),
com prós, contras e motivo da rejeição.

## Consequências
### Positivas
### Negativas
### Trade-off explícito
"Aceitamos X em troca de Y."

## Referências
Links relativos para outros ADRs/RFC/FDD quando existirem.

Requisitos extras:
- Pelo menos 1 ADR (o de "reuso dos padrões existentes" é o candidato natural)
  deve citar caminhos reais de arquivos, módulos ou classes do código.
- ADRs são independentes: cada um se lê sozinho, sem repetir detalhes de
  implementação que pertencem ao FDD.
```

---

## Etapa 3 — RFC (`docs/RFC.md`)

```text
ETAPA 3 de 9 — RFC. Entradas: @docs/adrs/ e @trabalho/INVENTARIO.md.
Releia os ADRs já escritos e construa
a proposta EM CIMA deles. As alternativas descartadas e as questões em
aberto da reunião têm lugar natural aqui.

Gere docs/RFC.md: proposta técnica submetida à equipe para revisão.
Nível ARQUITETURA, conciso (2 a 4 páginas). Nada de payload completo,
tabela de erros ou SQL — isso é do FDD.

Seções obrigatórias:
1. Metadados — Autor, Status (ex.: Em revisão), Data, Revisores
   (os participantes da reunião, com seus papéis)
2. Resumo executivo (TL;DR) — 3 a 5 linhas
3. Contexto e problema
4. Proposta técnica — visão geral: componentes (outbox, worker, entrega,
   assinatura, DLQ, API de gestão), fluxo em alto nível (pode usar um
   diagrama Mermaid simples), garantias oferecidas
5. Alternativas consideradas — pelo menos 2 alternativas DESCARTADAS na
   reunião. Para cada: descrição, trade-off que motivou o descarte, fonte
   [hh:mm] Nome. IDs RFC-ALT-01, RFC-ALT-02...
6. Questões em aberto — pelo menos 2 pontos ADIADOS ou NÃO DECIDIDOS na
   reunião, com quem levantou e o que falta para decidir. IDs RFC-Q-01...
7. Impacto e riscos — impacto no sistema atual, operação, segurança
8. Decisões relacionadas — links relativos para os ADRs
   (ex.: [ADR-001](./adrs/ADR-001-outbox-no-mysql.md)); no mínimo 2

Não reescreva o conteúdo dos ADRs: resuma em uma linha e linke.
```

---

## Etapa 4 — FDD (`docs/FDD.md`)

```text
ETAPA 4 de 9 — FDD. Entradas: @docs/adrs/, @docs/RFC.md,
@trabalho/INVENTARIO.md e os arquivos de código da seção H do inventário
(abra cada um antes de citá-lo). Com as decisões formalizadas (ADRs) e a proposta
consolidada (RFC), construa o desenho técnico sobre elas. Nada no FDD pode
contradizer um ADR ou o RFC; se encontrar conflito, pare e me reporte.
Lembre da seção obrigatória "Integração com o sistema existente".

Gere docs/FDD.md: especificação de implementação. É o documento mais
técnico; um dev deve conseguir começar a codar a partir dele.

Seções obrigatórias:
1. Contexto e motivação técnica
2. Objetivos técnicos (mensuráveis quando houver número na transcrição)
3. Escopo e exclusões
4. Fluxos detalhados (diagramas Mermaid de sequência + passos numerados):
   4.1 Criação do evento na outbox (na MESMA transação da mudança de status)
   4.2 Processamento pelo worker (polling, claim/lock, envio, marcação)
   4.3 Retry (política, backoff, limites — valores da transcrição)
   4.4 DLQ (quando entra, o que é guardado, como reprocessar)
5. Modelo de dados — tabelas/modelos Prisma propostos (outbox, endpoints,
   entregas/DLQ), campos e índices, coerentes com prisma/schema.prisma
6. Contratos públicos — mínimo 4 endpoints HTTP. Para cada um:
   método + rota (seguindo o padrão de rotas existente), autenticação,
   headers, request de exemplo (JSON), response de exemplo (JSON),
   status codes e semântica. Inclua também o contrato de SAÍDA do webhook
   (payload enviado ao cliente + headers como X-Event-Id e assinatura HMAC,
   e como o receptor valida a assinatura).
7. Matriz de erros — tabela | Código | HTTP | Quando ocorre | Mensagem | Ação |
   com códigos no padrão WEBHOOK_* (ex.: WEBHOOK_ENDPOINT_NOT_FOUND),
   mapeados nas classes de erro já existentes no projeto
8. Estratégias de resiliência — timeouts, retries, backoff, jitter (só se
   citado), idempotência, fallback, comportamento em falha do worker
9. Observabilidade — métricas (nomes e tipos), logs estruturados (campos,
   usando o logger existente), tracing (propagação de IDs/correlação)
10. Integração com o sistema existente (SEÇÃO OBRIGATÓRIA) —
    nomeie pelo menos 4 caminhos de arquivo REAIS e descreva, para cada um,
    o que muda e como: ex. como o método changeStatus será estendido para
    gravar na outbox dentro da transação, como as classes de erro existentes
    serão reutilizadas, como o schema Prisma recebe os novos modelos, como
    rotas/middlewares de auth são reaproveitados. Use tabela:
    | Arquivo | Elemento (classe/método) | Tipo de integração | Descrição |
11. Dependências e compatibilidade
12. Critérios de aceite técnicos (testáveis, formato Dado/Quando/Então)
13. Riscos e mitigação

Use IDs: FDD-FLUXO-NN, FDD-CONTRATO-NN, FDD-ERR-NN, FDD-INT-NN, FDD-CA-NN.
Todo valor numérico (timeouts, tentativas, intervalos) deve vir da
transcrição; se não vier, marque como ⚠️ Inferência.
```

---

## Etapa 5 — PRD (`docs/PRD.md`)

O PRD vem por último entre os grandes documentos: com ADRs, RFC e FDD em mãos, ele é praticamente uma consolidação.

```text
ETAPA 5 de 9 — PRD. Entradas: @docs/adrs/, @docs/RFC.md, @docs/FDD.md
e @trabalho/INVENTARIO.md.
Gere docs/PRD.md consolidando, em nível de PRODUTO, o que já está nesses
documentos. Sem detalhes de implementação. Não introduza nenhum requisito
que não esteja nos documentos anteriores ou na transcrição.

Seções obrigatórias:
1. Resumo e contexto da feature
2. Problema e motivação
3. Público-alvo e cenários de uso
4. Objetivos e métricas de sucesso — pelo menos 1 com métrica e meta
   quantitativa citada na reunião
5. Escopo
   5.1 Incluso
   5.2 Fora de escopo — pelo menos 2 itens DESCARTADOS ou ADIADOS na reunião,
       cada um com fonte [hh:mm] Nome
6. Requisitos funcionais — mínimo 8, IDs PRD-FR-01..., cada um com fonte
7. Requisitos não funcionais — IDs PRD-NFR-01...
8. Decisões e trade-offs principais (1 linha cada + link para o ADR)
9. Dependências
10. Riscos e mitigação — tabela | Risco | Probabilidade | Impacto | Mitigação |,
    pelo menos 2 riscos
11. Critérios de aceitação (visão de produto)
12. Estratégia de testes e validação
```

---

## Etapa 6 — Tracker (`docs/TRACKER.md`)

Duas formas válidas: **incremental** (rode a variante 6A ao final de cada etapa 2–5) ou **varredura no fim** (rode a 6B uma vez). Em ambos os casos, termine com a 6B para conferir a cobertura.

**6A — Incremental (após cada documento)**
```text
ETAPA 6 (incremental). Acabamos de concluir <documento>. Para cada item com
ID nesse documento, acrescente uma linha em docs/TRACKER.md no formato
abaixo. Não altere as linhas já existentes de outros documentos.
```

**6B — Varredura final**
```text
ETAPA 6 de 9 — Tracker. Varra docs/PRD.md, docs/RFC.md, docs/FDD.md e
docs/adrs/*.md e gere (ou complete) docs/TRACKER.md com UMA tabela no
formato exato:

| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |
|----|-----------|------|-------------------|-------|-------------|

- ID: o ID atribuído no documento (PRD-FR-01, RFC-ALT-02, ADR-003...)
- Documento: caminho do arquivo (docs/PRD.md, docs/adrs/ADR-002-...md)
- Tipo: Requisito Funcional | Requisito Não Funcional | Decisão |
  Restrição | Trade-off | Alternativa Descartada | Questão em Aberto |
  Fora de Escopo | Contrato | Erro | Integração | Risco | Métrica
- Conteúdo: resumo em uma linha
- Fonte: TRANSCRICAO ou CODIGO (somente esses dois valores)
- Localização: para TRANSCRICAO, `[hh:mm] Nome` exatamente como na
  transcrição; para CODIGO, caminho real do arquivo

Metas de cobertura (verifique e reporte no fim do arquivo):
- ≥ 80% dos itens identificáveis dos documentos têm linha
- ≥ 70% das linhas com Fonte = TRANSCRICAO e timestamp válido
- ≥ 5 linhas com Fonte = CODIGO e caminho existente

Ao final, adicione uma seção "Cobertura" com as contagens e uma lista
de itens sem fonte (deve ser vazia, ou conter só itens marcados ⚠️).
```

---

## Etapa 7 — README do processo (`README.md`)

Deixe por último, quando o processo já está completo e pode ser documentado com clareza.

```text
ETAPA 7 de 9 — README. Entradas: @notas-processo.md (registro das etapas e
dos ciclos de iteração) e os arquivos em .claude/commands/ (se usados).
Substitua o README.md da raiz (hoje contém o enunciado) pela documentação
do processo. Estrutura obrigatória:

1. Sobre o desafio — 1 a 2 parágrafos, nas minhas palavras
2. Ferramentas de IA utilizadas — lista com o papel de cada uma
3. Workflow adotado — as 9 etapas (contextualização → ADRs → RFC → FDD →
   PRD → Tracker → README → revisão final → iteração), como a interação
   com a IA foi organizada e quantos ciclos de iteração foram feitos
4. Prompts customizados — pelo menos 2, em blocos de código
5. Iterações e ajustes — pelo menos 2 momentos concretos em que a IA errou
   ou ficou superficial, o que foi corrigido e como; número de iterações
   principais
6. Como navegar a entrega — caminhos dos arquivos e ordem sugerida de leitura
   (sugestão: PRD → RFC → ADRs → FDD → TRACKER)

Opcional: link para o enunciado original.
Use os FATOS reais desta sessão (erros que corrigimos, prompts ajustados);
não invente iterações.
```

> 💡 Mantenha um arquivo `notas-processo.md` local durante as etapas anotando cada correção que você fizer — ele vira a seção "Iterações e ajustes".

---

## Etapa 8 — Revisão final (checklist de aceite)

Passe item por item antes da entrega. Para que o trabalho não se autoavalie, a auditoria roda num **subagente** (contexto limpo, sem ter visto a produção) e as correções vêm depois, na sessão principal.

```text
ETAPA 8 de 9 — Revisão final.

Passo 1 — Verificações mecânicas (rode no shell e mostre a saída):
- sha256sum -c --quiet trabalho/checksums-codigo.txt   (sem saída = nada em
  src/, prisma/, tests/ ou TRANSCRICAO.md foi alterado)
- ls docs/adrs/   (5 a 8 arquivos ADR-NNN-kebab-case.md)
- Extraia todos os caminhos src/…, prisma/…, tests/… citados em docs/ e
  confirme que cada um existe (liste os inexistentes)
- Extraia todos os [hh:mm] Nome citados em docs/ e confirme que cada par
  existe em TRANSCRICAO.md (liste os inválidos)
- Confirme que cada link relativo entre documentos (RFC → ADRs etc.) aponta
  para um arquivo existente

Passo 2 — Auditoria independente: lance um subagente general-purpose, sem
passar o histórico desta sessão, com a instrução: "Leia TRANSCRICAO.md, o
código e tudo em docs/ e README.md. Audite contra a checklist abaixo; para
cada item responda ✅ / ❌ com evidência (arquivo + trecho/contagem). Não
edite nenhum arquivo." Inclua a checklist no prompt do subagente.

Passo 3 — Mostre-me o relatório consolidado (passos 1 e 2) e pare.
Só corrija depois que eu aprovar a lista de correções.

PRD
[ ] Todas as 12 seções presentes
[ ] ≥ 8 requisitos funcionais da reunião
[ ] ≥ 1 objetivo com métrica e meta quantitativa
[ ] "Fora de escopo" com ≥ 2 itens descartados/adiados na reunião
[ ] ≥ 2 riscos com probabilidade, impacto e mitigação

RFC
[ ] Todas as 8 seções presentes; revisores = participantes da reunião
[ ] ≥ 2 alternativas descartadas, cada uma com trade-off
[ ] ≥ 2 questões em aberto/adiadas
[ ] Links para ≥ 2 ADRs (links funcionando)
[ ] Tamanho 2–4 páginas, sem detalhe de implementação

FDD
[ ] Todas as seções obrigatórias + "Integração com o sistema existente"
[ ] ≥ 4 endpoints com request, response e status codes
[ ] Matriz de erros só com códigos WEBHOOK_*
[ ] ≥ 4 caminhos de arquivo reais na seção de integração
[ ] Observabilidade cita métricas, logs E tracing

ADRs
[ ] 5–8 arquivos nomeados ADR-NNN-kebab-case.md
[ ] Cada um com Status, Contexto, Decisão, Alternativas Consideradas, Consequências
[ ] Cobrem ≥ 5 das 6 decisões principais
[ ] ≥ 1 ADR cita arquivos/módulos/classes do código

TRACKER
[ ] Tabela no formato exato (6 colunas)
[ ] Cobertura ≥ 80%; ≥ 70% TRANSCRICAO com [hh:mm] Nome; ≥ 5 linhas CODIGO

README
[ ] 6 seções obrigatórias; ≥ 1 ferramenta; ≥ 2 prompts em bloco de código;
    ≥ 2 iterações concretas

CONSISTÊNCIA
[ ] Nenhum item contradiz a transcrição ou o código
[ ] TODO caminho de arquivo citado existe no repositório (verifique um a um)
[ ] TODO timestamp citado existe em TRANSCRICAO.md com o falante correto
[ ] Nenhum arquivo em src/, prisma/, tests/ ou configs foi alterado
[ ] Nenhum conteúdo duplicado entre RFC e FDD
```

---

## Etapa 9 — Iterar (3 a 5 ciclos)

É esperado que o processo demande de 3 a 5 ciclos de geração, revisão crítica, ajuste de prompt e nova geração. Se tudo saiu de primeira sem ajustes, os documentos provavelmente estão genéricos demais.

**Ciclo de iteração**

1. **Gerar** — rode o prompt da etapa.
2. **Revisar criticamente** — aplique os prompts de revisão abaixo e leia você mesmo, conferindo timestamps e caminhos por amostragem. No Claude Code, prefira rodar a "Caça a alucinações" num subagente (contexto limpo, sem acesso ao raciocínio que gerou o documento) com a instrução "não edite arquivos, apenas reporte".
3. **Ajustar o prompt** — transforme cada falha em uma instrução nova ou mais precisa (não apenas "melhore").
4. **Regenerar** — rode a versão ajustada só nas seções afetadas.
5. **Registrar** — anote em `notas-processo.md`: o que estava errado, qual prompt foi ajustado, qual foi o resultado. Se a etapa virou comando, atualize também `.claude/commands/etapa-N.md`.

```text
ETAPA 9 — Ciclo de iteração <N> sobre <documento>.
Problemas encontrados na revisão:
- <problema 1, com trecho e motivo>
- <problema 2>
Corrija SOMENTE esses pontos, mantendo IDs existentes estáveis.
Depois liste o que mudou (antes → depois) e quais linhas do
docs/TRACKER.md precisam ser atualizadas por causa disso.
```

**Registro de iteração (para `notas-processo.md`)**
```markdown
### Iteração N — <documento> — <data>
- Problema: <o que a IA gerou de errado ou superficial>
- Como detectei: <prompt de revisão / leitura manual / checklist>
- Ajuste no prompt: <instrução adicionada ou alterada>
- Resultado: <o que mudou>
```

### Prompts de revisão crítica

**Caça a alucinações**
```text
Para cada afirmação de <documento>, mostre a linha exata da transcrição
ou o arquivo de código que a sustenta. Liste separadamente tudo que você
não conseguir sustentar. Não justifique, apenas liste.
```

**Fronteira entre documentos**
```text
Compare docs/RFC.md e docs/FDD.md. Liste todo parágrafo do RFC que desce
ao nível de implementação (payloads, códigos de erro, campos de tabela,
valores de configuração) e proponha a versão de uma linha + link para o FDD.
```

**Descartado × adiado × decidido**
```text
Releia a transcrição procurando por expressões como "não vamos",
"fica pra depois", "fase 2", "descarta", "por enquanto", "ainda não sei",
"vamos ver". Para cada ocorrência, diga se o documento atual trata o item
corretamente (fora de escopo, questão em aberto ou alternativa descartada).
```

**Genericidade**
```text
Aponte trechos de <documento> que poderiam estar em qualquer projeto de
webhooks (texto genérico). Reescreva cada um ancorando em uma fala
específica da reunião ou em um elemento concreto do código deste OMS.
```