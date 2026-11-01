# ADR-007: Resolver filtro de status e payload do evento na inserção da outbox

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** filtro: Marcos, Bruno, Diego; snapshot: Larissa, Diego, Bruno. Marcos e Sofia já tinham saído da call quando o snapshot foi decidido (registro de saída às 09:50 em `TRANSCRICAO.md`), e essa decisão não consta do resumo de `[09:48] Larissa`
- **Fontes:** `[09:04] Bruno`, `[09:25] Diego`, `[09:33] Bruno`, `[09:33] Marcos`, `[09:34] Diego`, `[09:34] Bruno`, `[09:40] Bruno`, `[09:43] Diego`, `[09:44] Sofia`, `[09:48] Larissa`, `[09:51] Bruno`, `[09:52] Larissa`, `[09:52] Diego`, `[09:52] Bruno`, `src/modules/orders/order.service.ts`, `src/modules/orders/order.status.ts`

## Contexto

Cada endpoint escolhe os status que quer receber (`[09:33] Bruno`, `[09:33] Marcos`), e o pedido pode mudar entre o registro do evento e o envio, que pode acontecer horas depois se houver retry. A reunião tratou de duas perguntas sobre o mesmo momento: filtrar antes ou depois de inserir (`[09:34] Diego`) e guardar o payload pronto ou renderizá-lo no envio (`[09:51] Bruno`). Nos dois casos, a resposta foi resolver na inserção.

## Decisão

- **ADR-007-D-01:** o filtro de status é aplicado na inserção da outbox. Se nenhum webhook do cliente quer aquele status, nenhuma linha é inserida (`[09:33] Marcos`, `[09:34] Bruno`, `[09:34] Diego`).
- **ADR-007-D-02:** o payload é renderizado e guardado na inserção, como snapshot (`[09:52] Larissa`, `[09:52] Diego`, `[09:52] Bruno`).

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Motivo da rejeição | Fonte |
|---|---|---|---|---|---|
| ADR-007-ALT-01 | Filtrar na hora do envio | Nenhum citado | Gera linhas desnecessárias | Filtrar na inserção "economiza linha na tabela" | `[09:34] Diego`, `[09:34] Bruno` |
| ADR-007-ALT-02 | Guardar só `order_id` e renderizar no envio | Nenhum citado | Se o pedido mudar depois, o evento deixa de refletir o estado do momento da mudança | "Senão tem caso esquisito" | `[09:51] Bruno`, `[09:52] Larissa` |

## Consequências

### Positivas

- A outbox só guarda eventos que têm interessado (`[09:34] Bruno`).
- O evento continua refletindo o estado de quando o status mudou, mesmo em caso de retry (`[09:52] Larissa`).

### Negativas

- A inserção passa a exigir uma consulta às configurações de webhook do cliente dentro da transação de `changeStatus` (`src/modules/orders/order.service.ts`), que já foi descrita como pesada (`[09:04] Bruno`).
- Uma alteração no filtro só vale para mudanças de status futuras, consequência direta de `[09:34] Bruno`.
- O snapshot pode estar defasado em relação ao pedido atual. Para detalhes, o cliente consulta `GET /orders/:id` (`[09:43] Diego`).

### Trade-off explícito

Aceitamos fazer mais trabalho dentro da transação de pedidos, em troca de uma outbox menor e de eventos que preservam o estado do momento da mudança.

## Referências

- [ADR-001: Outbox no MySQL](./ADR-001-outbox-no-mysql.md)
- [ADR-003: Retry com backoff e DLQ](./ADR-003-retry-com-backoff-e-dlq.md)
- [ADR-005: Entrega at-least-once](./ADR-005-entrega-at-least-once-com-event-id.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-04.** Há uma linha na outbox e um `event_id` por endpoint interessado, cada uma com retry próprio. Apoio: `[09:25] Diego`, `[09:34] Bruno`, `[09:44] Sofia`.

> ⚠️ Inferência (sem fonte direta): **INF-10.** O filtro aceita só `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED` e `CANCELLED`, porque nenhuma transição leva a `PENDING` (`src/modules/orders/order.status.ts`). A criação do pedido não gera evento: a integração citada é em `changeStatus` (`[09:40] Bruno`), e `OrderService.create` grava o histórico inicial direto (`src/modules/orders/order.service.ts`).

> ⚠️ Inferência (sem fonte direta): **INF-11.** O snapshot dispensa vínculo forte entre a outbox e o pedido (`[09:52] Larissa`); o modelo está no FDD.

**Ponto sem decisão, para revisão humana:** o que acontece com eventos pendentes quando o webhook é editado ou removido.
