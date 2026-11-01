# ADR-002: Processar a outbox com um único worker, em processo separado e polling de 2 segundos

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Larissa, Diego, Bruno; Marcos validou o intervalo do ponto de vista de produto (`[09:10] Marcos`)
- **Fontes:** `[09:02] Marcos`, `[09:08] Diego`, `[09:09] Diego`, `[09:09] Bruno`, `[09:10] Marcos`, `[09:10] Larissa`, `[09:11] Diego`, `[09:11] Larissa`, `[09:11] Bruno`, `[09:12] Larissa`, `[09:12] Diego`, `[09:13] Bruno`, `[09:13] Diego`, `[09:13] Larissa`, `[09:14] Marcos`, `[09:24] Diego`, `[09:28] Bruno`, `[09:29] Diego`, `[09:30] Bruno`, `[09:42] Diego`, `[09:48] Larissa`, `src/server.ts`, `src/config/database.ts`, `package.json`

## Contexto

Os eventos gravados na outbox precisam ser lidos e enviados por algum processo. Para os clientes, qualquer tempo abaixo de 10 segundos já é "tempo real" (`[09:02] Marcos`).

O projeto tem hoje um único entry-point, `src/server.ts`, e `package.json` só tem scripts para a API (`dev`, `build`, `start`). O MySQL não tem um listener nativo como o `NOTIFY/LISTEN` do Postgres (`[09:09] Diego`).

## Decisão

- **ADR-002-D-01:** o worker faz polling em loop: a cada 2 segundos, busca os eventos pendentes mais antigos em batch pequeno e os processa (`[09:08] Diego`, `[09:09] Diego`, `[09:10] Larissa`).
- **ADR-002-D-02:** o worker roda em processo separado da API, com o novo entry-point `src/worker.ts` e o novo script `npm run worker` (`[09:11] Diego`, `[09:11] Larissa`, `[09:28] Bruno`).
- **ADR-002-D-03:** o worker usa o mesmo banco e a mesma `DATABASE_URL`, com sua própria instância de `PrismaClient`, porque é outro processo Node (`[09:11] Diego`, `[09:30] Bruno`). `src/config/database.ts` já cria uma instância por processo.
- **ADR-002-D-04:** roda um único worker, que processa por ordem de `created_at`. Não há ordem global: a garantia é só por `order_id` e enquanto houver um único worker, e isso fica documentado como limitação conhecida (`[09:12] Diego`, `[09:13] Larissa`).

O intervalo de 2 segundos é registrado aqui como intervalo de polling. A fala "latência mínima [...] 2 segundos no pior caso" (`[09:10] Larissa`) tem termos contraditórios e não é tratada como meta de latência.

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Situação e motivo | Fonte |
|---|---|---|---|---|---|
| ADR-002-ALT-01 | Trigger no banco para notificar o worker | Seria mais reativo | Trigger só executa SQL; avisar o worker exigiria improviso, como escrever em arquivo ou chamar um endpoint | **Descartada:** "fica esquisito", e o polling de 2s já atende | `[09:09] Bruno`, `[09:09] Diego` |
| ADR-002-ALT-02 | Worker dentro do processo da API | Nenhum citado | Se a API reinicia, o worker cai junto | **Descartada** | `[09:11] Diego` |
| ADR-002-ALT-03 | Compartilhar a instância de `PrismaClient` entre API e worker | Nenhum citado | Não se aplica a processos diferentes | **Descartada:** a fala inicial de usar "o mesmo Prisma client" foi corrigida depois | `[09:11] Bruno`, `[09:29] Diego`, `[09:30] Bruno` |
| ADR-002-ALT-04 | Múltiplos workers, com partição por `order_id` ou lock pessimista | Permitiria escalar | Sem esses mecanismos, perde-se a garantia de ordem | **Adiada:** "problema do futuro" | `[09:12] Diego`, `[09:13] Bruno`, `[09:13] Diego` |

## Consequências

### Positivas

- Reiniciar a API não derruba o processamento (`[09:11] Diego`).
- O intervalo de polling cabe na meta de 10 segundos (`[09:09] Diego`, `[09:10] Marcos`).
- Nenhuma infraestrutura nova: mesmo banco, mesma stack (`[09:11] Diego`).

### Negativas

- Passa a existir um segundo processo para implantar e operar, com o novo entry-point (`[09:11] Larissa`).
- O worker consulta o banco a cada 2 segundos, mesmo sem eventos (`[09:09] Diego`).
- A ordem não é global (`[09:13] Larissa`), o que os clientes não pediram (`[09:14] Marcos`).
- **Risco:** com um único worker e timeout de 10 segundos por chamada (`[09:42] Diego`), um cliente que não responde pode atrasar os eventos dos demais além da meta de 10 segundos (`[09:02] Marcos`). A reunião não tratou desse cenário, e a decisão de manter um único worker continua valendo.
- A ordem vale apenas enquanto não há retry (ver INF-05 abaixo).

### Trade-off explícito

Aceitamos o custo de um processo adicional, o polling contínuo e a falta de ordem global, em troca de atender à meta de 10 segundos sem infraestrutura nova e de isolar o processamento dos reinícios da API.

## Referências

- [ADR-001: Outbox no MySQL](./ADR-001-outbox-no-mysql.md)
- [ADR-003: Retry com backoff e DLQ](./ADR-003-retry-com-backoff-e-dlq.md)
- [ADR-005: Entrega at-least-once](./ADR-005-entrega-at-least-once-com-event-id.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-05.** A ordem por `order_id` só vale sem retry: um evento em backoff pode ser ultrapassado pelo seguinte do mesmo pedido, e não há bloqueio por pedido. Apoio: `[09:12] Diego`, `[09:13] Larissa`.

> ⚠️ Inferência (sem fonte direta): **INF-16.** Ao iniciar, o worker devolve a `pendente` as linhas em `processando`. Como há um único worker, elas só podem ser sobras de uma queda. Isso pode gerar reenvio, o que o at-least-once admite. Apoio: `[09:12] Diego`, `[09:24] Diego`.

> ⚠️ Inferência (sem fonte direta): **INF-19.** O arquivo da lógica de processamento é uma das duas opções citadas por Bruno; a escolha está no FDD. Apoio: `[09:28] Bruno`.
