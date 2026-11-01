# ADR-004: Assinar as entregas com HMAC-SHA256 e secret por endpoint, com rotação de 24 horas

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Sofia; Larissa consolidou a decisão no resumo final (`[09:48] Larissa`)
- **Fontes:** `[09:19] Sofia`, `[09:20] Sofia`, `[09:20] Bruno`, `[09:21] Sofia`, `[09:21] Bruno`, `[09:22] Diego`, `[09:22] Sofia`, `[09:23] Sofia`, `[09:31] Marcos`, `[09:44] Diego`, `[09:46] Sofia`, `[09:48] Larissa`, `[09:49] Sofia`, `src/shared/logger/index.ts`

## Contexto

Os webhooks expõem dados de pedidos a endpoints fora da infraestrutura da empresa. O cliente precisa conseguir validar que a requisição veio mesmo da plataforma e que o payload não foi adulterado (`[09:19] Sofia`). A rotação não é um cenário teórico: um cliente já vazou sua secret em log de aplicação (`[09:22] Diego`).

O código não usa `crypto` hoje, e `redactPaths`, em `src/shared/logger/index.ts`, não cobre um campo `secret`.

A exigência de HTTPS foi tratada por Sofia como validação de schema, "nem é decisão arquitetural" (`[09:23] Sofia`), e por isso não faz parte desta decisão.

## Decisão

- **ADR-004-D-01:** toda entrega leva uma assinatura HMAC-SHA256 calculada sobre o corpo do request, no header `X-Signature`, e o cliente a verifica do lado dele (`[09:20] Sofia`, `[09:22] Sofia`).
- **ADR-004-D-02:** cada endpoint de webhook tem uma secret única, gerada pela plataforma e devolvida na criação (`[09:21] Sofia`, `[09:31] Marcos`).
- **ADR-004-D-03:** a secret é rotacionável pela API. Depois da rotação, a antiga continua válida por 24 horas em paralelo e então deixa de valer (`[09:21] Sofia`, `[09:22] Sofia`).

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Motivo da rejeição | Fonte |
|---|---|---|---|---|---|
| ADR-004-ALT-01 | Secret global da plataforma | Nenhum citado | "Se vaza uma, vaza tudo" | Um único vazamento comprometeria todos os clientes | `[09:21] Sofia` |

## Consequências

### Positivas

- O cliente valida origem e integridade com uma técnica para a qual "todo cliente sério tem biblioteca" (`[09:19] Sofia`, `[09:20] Sofia`).
- O vazamento de uma secret fica limitado a um endpoint (`[09:21] Sofia`).
- O cliente pode trocar a secret sem interromper a integração durante as 24 horas (`[09:21] Sofia`).

### Negativas

- Cada cliente precisa implementar a verificação da assinatura (`[09:20] Sofia`).
- Para assinar, a plataforma precisa ter acesso à secret, e a tabela de configuração a armazena (`[09:21] Bruno`, `[09:21] Sofia`). A forma de guardá-la não foi definida.
- `redactPaths` não cobre `secret` (`src/shared/logger/index.ts`), então um log que inclua esse campo não seria mascarado.
- **Limitação:** `X-Timestamp` serve para o cliente detectar replay (`[09:44] Diego`), mas o HMAC cobre só o corpo (`[09:22] Sofia`). O timestamp não é assinado e pode ser alterado sem invalidar a assinatura.
- O deploy depende de ao menos 2 dias úteis de revisão de segurança, com foco em HMAC e geração de secret (`[09:46] Sofia`, `[09:49] Sofia`).

### Trade-off explícito

Aceitamos gerenciar uma secret por endpoint, mais a janela de rotação, e transferir ao cliente a verificação da assinatura, em troca de limitar o alcance de um vazamento e permitir a troca da secret sem parada.

## Referências

- [ADR-005: Entrega at-least-once](./ADR-005-entrega-at-least-once-com-event-id.md)
- [ADR-006: Reuso dos padrões existentes](./ADR-006-reuso-dos-padroes-existentes.md)
- [ADR-008: Controle de acesso da API de webhooks](./ADR-008-controle-de-acesso-da-api-de-webhooks.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-03.** Durante as 24 horas de carência, `X-Signature` leva duas assinaturas, da secret nova e da antiga. Sem isso, a "validade em paralelo" não funcionaria para todos os clientes durante a migração. Item para a revisão da Sofia. Apoio: `[09:21] Sofia`, `[09:22] Sofia`, `[09:44] Diego`.

> ⚠️ Inferência (sem fonte direta): **INF-42.** A criptografia da secret em repouso não foi discutida na reunião e segue sem decisão.

> ⚠️ Inferência (sem fonte direta): **INF-38.** Este ADR encaminha esse ponto e a assinatura do `X-Timestamp` à revisão da Sofia, o que não foi combinado na reunião. O foco citado por ela é HMAC e geração de secret (`[09:46] Sofia`).
