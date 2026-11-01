# ADR-001: Registrar eventos de webhook em outbox no MySQL, na mesma transação da mudança de status

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Larissa, Diego, Bruno
- **Fontes:** `[09:00] Marcos`, `[09:03] Larissa`, `[09:04] Bruno`, `[09:06] Diego`, `[09:07] Larissa`, `[09:07] Diego`, `[09:07] Bruno`, `[09:08] Diego`, `[09:08] Larissa`, `[09:40] Bruno`, `[09:41] Bruno`, `[09:41] Diego`, `[09:48] Larissa`, `src/modules/orders/order.service.ts`

## Contexto

Três clientes B2B pediram para ser notificados quando o status dos seus pedidos muda, em vez de consultar `GET /orders` periodicamente (`[09:00] Marcos`). A pergunta inicial foi se o disparo seria síncrono no service de pedidos ou passaria por alguma fila ou outbox (`[09:03] Larissa`).

Em `OrderService.changeStatus` (`src/modules/orders/order.service.ts`), a mudança de status já roda dentro de `prisma.$transaction`: valida a transição, ajusta o estoque quando aplicável, atualiza `orders` e insere em `order_status_history`. Bruno descreveu essa transação como "pesada" e levantou dois problemas do envio síncrono: um cliente lento travaria outras mudanças de status, e um cliente fora do ar não pode causar rollback (`[09:04] Bruno`).

O código não tem hoje filas nem eventos (`src/modules/orders/order.service.ts` não publica nada), e o time é pequeno (`[09:07] Diego`).

## Decisão

- **ADR-001-D-01:** nenhuma chamada HTTP ao cliente acontece dentro da transação de mudança de status (`[09:04] Bruno`, `[09:06] Diego`).
- **ADR-001-D-02:** o evento é gravado em uma tabela `webhook_outbox` no MySQL já existente, dentro da mesma transação que atualiza `orders` e `order_status_history`. Se a transação fizer commit, o evento fica registrado; se fizer rollback, ele é descartado (`[09:06] Diego`, `[09:08] Larissa`, `[09:48] Larissa`).
- **ADR-001-D-03:** se a inserção na outbox falhar, a mudança de status sofre rollback. Não pode haver status alterado sem evento (`[09:40] Bruno`, `[09:41] Diego`).
- **ADR-001-D-04:** o service de pedidos grava o evento pela função `publishWebhookEvent(tx, order, fromStatus, toStatus)`, que recebe o client da transação atual (`[09:41] Bruno`, `[09:41] Diego`). A função ainda não existe no código.

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Motivo da rejeição | Fonte |
|---|---|---|---|---|---|
| ADR-001-ALT-01 | Chamada HTTP síncrona dentro da transação | Nenhum citado | Cliente lento trava outras mudanças; cliente fora do ar não pode causar rollback | "Síncrono está fora de questão" | `[09:04] Bruno`, `[09:06] Diego` |
| ADR-001-ALT-02 | Redis Streams ou Redis Cluster | Nenhum citado | Exige subir mais infraestrutura | Overengineering para um time pequeno | `[09:07] Larissa`, `[09:07] Diego` |
| ADR-001-ALT-03 | Injetar um repository de webhook no `OrderService` | Nenhum citado | Dependência maior do que o necessário | Uma função recebendo `tx` basta | `[09:41] Bruno`, `[09:41] Diego` |

## Consequências

### Positivas

- Mudança de status e registro do evento ficam atômicos (`[09:06] Diego`).
- A disponibilidade do cliente deixa de afetar a transação de pedidos (`[09:04] Bruno`).
- Nenhuma infraestrutura nova além do MySQL existente (`[09:07] Diego`).

### Negativas

- A transação, já descrita como pesada (`[09:04] Bruno`), ganha mais uma escrita.
- Uma falha ao gravar na outbox passa a impedir a mudança de status (`[09:40] Bruno`).
- A tabela cresce com o uso, e Bruno levantou essa preocupação de desempenho (`[09:07] Bruno`). A resposta foi indexar `status` e `created_at` e arquivar linhas entregues "depois de 30 dias ou assim", mas o arquivamento ficou fora do escopo desta feature (`[09:08] Diego`).

### Trade-off explícito

Aceitamos acrescentar trabalho à transação de `changeStatus` e fazer a mudança de status depender da inserção na outbox, em troca de nunca ter status alterado sem evento registrado e de não operar infraestrutura nova.

## Referências

- [ADR-002: Worker separado em polling](./ADR-002-worker-separado-em-polling.md)
- [ADR-005: Entrega at-least-once](./ADR-005-entrega-at-least-once-com-event-id.md)
- [ADR-007: Evento materializado na inserção](./ADR-007-evento-materializado-na-insercao.md)

## Inferências para revisão humana

Nenhuma.
