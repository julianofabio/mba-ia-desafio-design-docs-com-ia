# ADR-005: Garantir entrega at-least-once, com deduplicação no cliente por X-Event-Id

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Larissa, Diego; Sofia apontou o custo para o cliente (`[09:25] Sofia`) e Marcos assumiu a documentação (`[09:26] Marcos`)
- **Fontes:** `[09:18] Diego`, `[09:24] Diego`, `[09:25] Bruno`, `[09:25] Diego`, `[09:25] Sofia`, `[09:26] Marcos`, `[09:26] Larissa`, `[09:34] Bruno`, `[09:44] Sofia`, `[09:48] Larissa`, `src/modules/orders/order.service.ts`

## Contexto

Com um worker que envia por HTTP, marca o resultado e tenta de novo em caso de falha, o mesmo evento pode chegar duas vezes ao cliente (`[09:24] Diego`). Bruno perguntou como o cliente diferenciaria essas repetições (`[09:25] Bruno`). Sofia observou que a solução proposta "joga responsabilidade pro cliente" (`[09:25] Sofia`).

## Decisão

- **ADR-005-D-01:** a garantia de entrega é at-least-once, e o cliente pode receber o mesmo evento mais de uma vez (`[09:24] Diego`, `[09:26] Larissa`, `[09:48] Larissa`).
- **ADR-005-D-02:** cada entrega leva o header `X-Event-Id`, com um UUID gerado quando o evento entra na outbox (`[09:25] Diego`).
- **ADR-005-D-03:** a deduplicação é responsabilidade do cliente, pelo `X-Event-Id` (`[09:25] Diego`, `[09:26] Larissa`).
- **ADR-005-D-04:** esse comportamento será documentado com destaque no portal de desenvolvedor (`[09:26] Marcos`).

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Motivo da rejeição | Fonte |
|---|---|---|---|---|---|
| ADR-005-ALT-01 | Exactly-once | Evitaria a responsabilidade no cliente apontada por Sofia | Exige coordenação dos dois lados | "Fica muito mais complexo" | `[09:25] Sofia`, `[09:25] Diego` |

## Consequências

### Positivas

- A plataforma não precisa coordenar a entrega com os sistemas dos clientes (`[09:25] Diego`).
- Diego apontou o modelo como padrão de mercado, citando Stripe e GitHub (`[09:25] Diego`).
- Reenvios são seguros para quem deduplica (`[09:25] Diego`); no caso do replay, isso depende de INF-12.

### Negativas

- Todo cliente precisa implementar a deduplicação (`[09:25] Sofia`).
- A clareza da documentação no portal passa a importar para a integração funcionar corretamente (`[09:26] Marcos`).
- `X-Event-Id` não cobre transições duplicadas: `changeStatus` não usa lock nem coluna de versão (`src/modules/orders/order.service.ts`), então requisições simultâneas poderiam gerar duas transições, cada uma com seu próprio `event_id`. Essa é uma interpretação da leitura do código, não reproduzida.

### Trade-off explícito

Aceitamos transferir a deduplicação para o cliente e admitir entregas repetidas, em troca de um mecanismo sem coordenação entre os dois lados, que Diego comparou ao de Stripe e GitHub (`[09:25] Diego`), com o custo que Sofia apontou (`[09:25] Sofia`) e que Marcos assumiu documentar no portal (`[09:26] Marcos`).

## Referências

- [ADR-001: Outbox no MySQL](./ADR-001-outbox-no-mysql.md)
- [ADR-002: Worker separado em polling](./ADR-002-worker-separado-em-polling.md)
- [ADR-003: Retry com backoff e DLQ](./ADR-003-retry-com-backoff-e-dlq.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-04.** Há uma linha na outbox e um `event_id` por endpoint interessado, cada uma com retry próprio. Assim, um cliente com dois endpoints recebe `event_id` diferentes para a mesma mudança de status. `[09:25] Diego` diz "único por evento", mas não trata de vários endpoints. Apoio: `[09:25] Diego`, `[09:34] Bruno`, `[09:44] Sofia`.

> ⚠️ Inferência (sem fonte direta): **INF-12.** O replay mantém o `event_id`, para que o cliente consiga deduplicar um evento reprocessado. Apoio: `[09:18] Diego`, `[09:25] Diego`.
