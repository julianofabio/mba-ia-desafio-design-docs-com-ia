# ADR-008: Usar JWT existente, customer_id explícito e role ADMIN apenas no replay

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Larissa, Sofia
- **Fontes:** `[09:31] Marcos`, `[09:32] Bruno`, `[09:32] Marcos`, `[09:32] Larissa`, `[09:33] Bruno`, `[09:34] Marcos`, `[09:35] Larissa`, `[09:36] Sofia`, `[09:36] Larissa`, `[09:36] Marcos`, `[09:37] Sofia`, `[09:48] Larissa`, `src/middlewares/auth.middleware.ts`, `src/modules/users/user.routes.ts`, `src/modules/users/user.service.ts`, `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.schemas.ts`, `src/modules/orders/order.schemas.ts`, `prisma/schema.prisma`

## Contexto

Marcos propôs que o `customer_id` viesse implícito no JWT (`[09:31] Marcos`). Bruno observou que o JWT é do usuário operador, não do cliente (`[09:32] Bruno`). O código confirma: `authenticate` só extrai `sub`, `email` e `role` do token (`src/middlewares/auth.middleware.ts`), e `requireRole` já existe, com uso de referência em `src/modules/users/user.routes.ts`.

O cadastro será feito direto na API, com o JWT do sistema (`[09:32] Marcos`).

## Decisão

- **ADR-008-D-01:** os endpoints de webhook usam a autenticação normal por JWT, e o `customer_id` é informado no body ou no path, sem vir do token (`[09:32] Larissa`).
- **ADR-008-D-02:** o replay da DLQ exige role `ADMIN`, reusando `requireRole` (`[09:36] Sofia`, `[09:36] Larissa`, `[09:48] Larissa`).
- **ADR-008-D-03:** o endpoint de replay registra em log quem o executou, para auditoria (`[09:36] Sofia`).
- **ADR-008-D-04:** o restante do CRUD de configuração aceita qualquer role autenticada, "por enquanto" (`[09:36] Marcos`, `[09:37] Sofia`, `[09:48] Larissa`).

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Situação e motivo | Fonte |
|---|---|---|---|---|---|
| ADR-008-ALT-01 | `customer_id` implícito no JWT | Nenhum citado | O JWT atual é do usuário operador e não carrega cliente | **Descartada** | `[09:31] Marcos`, `[09:32] Bruno`, `[09:32] Larissa` |
| ADR-008-ALT-02 | Permissões mais restritas no CRUD | Nenhum citado | Nenhum citado | **Adiada:** "mais pra frente a gente pode endurecer" | `[09:36] Marcos`, `[09:37] Sofia` |

## Consequências

### Positivas

- Nenhuma mudança no token nem nos middlewares de autenticação (`src/middlewares/auth.middleware.ts`).
- O reprocessamento da fila fica restrito a `ADMIN`, porque "não é coisa de operador" (`[09:36] Sofia`).

### Negativas

- **Risco: o requisito de `ADMIN` pode ser contornado.** `POST /auth/register` não exige autenticação (`src/modules/auth/auth.routes.ts`), `registerSchema` aceita `role: ADMIN` (`src/modules/auth/auth.schemas.ts`), e `UserService.createUser` grava esse valor (`src/modules/users/user.service.ts`). Pela leitura do código, não reproduzida, qualquer pessoa com acesso à API poderia criar um usuário `ADMIN` e executar o replay.
- **Risco: não há isolamento entre clientes.** A fala "a gente tem usuários que representam o cliente" (`[09:32] Marcos`) não encontra respaldo no schema: `User` não tem relação com `Customer` (`prisma/schema.prisma`). Com o `customer_id` informado na requisição e qualquer role autenticada aceita, nada no modelo atual impede um usuário de operar webhooks de outro cliente, inclusive ler payloads no histórico de entregas pedido em `[09:34] Marcos`.

Este ADR encaminha os dois riscos à revisão de segurança da Sofia (ver INF-38 abaixo). Esta entrega é só documental e não propõe mudança de código para eles.

### Trade-off explícito

Aceitamos, por enquanto, um controle de acesso amplo no CRUD, em troca de reusar a autenticação existente sem mudar o token nem o modelo de usuários, deixando o endurecimento para depois.

## Referências

- [ADR-003: Retry com backoff e DLQ](./ADR-003-retry-com-backoff-e-dlq.md)
- [ADR-004: Assinatura HMAC](./ADR-004-assinatura-hmac-com-secret-por-endpoint.md)
- [ADR-006: Reuso dos padrões existentes](./ADR-006-reuso-dos-padroes-existentes.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-07.** `customerId` vai no body em `POST /webhooks`, como em `createOrderSchema` (`src/modules/orders/order.schemas.ts`), e no path em `GET /customers/:customerId/webhooks`. A reunião deixou as duas opções abertas (`[09:32] Larissa`).

> ⚠️ Inferência (sem fonte direta): **INF-42.** SSRF não foi discutido na reunião, embora o worker vá chamar URLs informadas por usuários autenticados.

> ⚠️ Inferência (sem fonte direta): **INF-38.** Encaminhar esse ponto e os dois riscos acima à revisão da Sofia é uma decisão de quem escreve, não combinada na reunião.
