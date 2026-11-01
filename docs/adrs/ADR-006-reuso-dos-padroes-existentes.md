# ADR-006: Construir webhooks como um módulo comum, reusando os padrões do projeto

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Larissa, Bruno; Diego concordou com a estrutura (`[09:28] Diego`)
- **Fontes:** `[09:23] Sofia`, `[09:27] Bruno`, `[09:28] Diego`, `[09:28] Bruno`, `[09:29] Larissa`, `[09:29] Bruno`, `[09:30] Larissa`, `[09:31] Marcos`, `[09:48] Larissa`, `src/modules/orders/`, `src/modules/orders/order.schemas.ts`, `src/app.ts`, `src/routes/index.ts`, `src/shared/errors/app-error.ts`, `src/shared/errors/http-errors.ts`, `src/middlewares/error.middleware.ts`, `src/middlewares/validate.middleware.ts`, `src/shared/logger/index.ts`, `src/server.ts`, `src/middlewares/request-logger.middleware.ts`

## Contexto

O projeto já tem um padrão claro: cada domínio é um módulo em `src/modules`, com controller, service, repository, routes e schemas (`[09:27] Bruno`). Ao tratar da estrutura da feature, a equipe optou por seguir esse padrão, em vez de criar outro (`[09:30] Larissa`).

## Decisão

**ADR-006-D-01:** reuso máximo do que já existe, com webhook sendo "módulo igual aos outros" (`[09:30] Larissa`, `[09:48] Larissa`). Na prática:

| ID | Padrão | Elemento real | Como será reusado | Fonte |
|---|---|---|---|---|
| ADR-006-D-02 | Módulos | `src/modules/orders/` (`order.routes.ts`, `order.controller.ts`, `order.service.ts`, `order.repository.ts`, `order.schemas.ts`) | Molde para o novo `src/modules/webhooks` | `[09:27] Bruno` |
| ADR-006-D-03 | Composição e rotas | `buildControllers` em `src/app.ts`; `Controllers` e `buildApiRouter` em `src/routes/index.ts` | O módulo novo é ligado da mesma forma, sob `/api/v1` | `[09:27] Bruno` |
| ADR-006-D-04 | Erros | `AppError` em `src/shared/errors/app-error.ts`; `InsufficientStockError` e `InvalidStatusTransitionError` em `src/shared/errors/http-errors.ts` | Erros próprios seguem o mesmo modelo | `[09:28] Bruno`, `[09:30] Larissa` |
| ADR-006-D-05 | Códigos de erro | `INSUFFICIENT_STOCK`, `INVALID_STATUS_TRANSITION` | Prefixo `WEBHOOK_` em todo o módulo | `[09:28] Bruno`, `[09:29] Larissa` |
| ADR-006-D-06 | Tratamento central de erros | `errorMiddleware` em `src/middlewares/error.middleware.ts` | Atende as rotas novas sem alteração | `[09:29] Bruno` |
| ADR-006-D-07 | Logger | `logger` (Pino) em `src/shared/logger/index.ts` | Nenhuma dependência nova de log | `[09:29] Bruno` |
| ADR-006-D-08 | Validação | `validate` em `src/middlewares/validate.middleware.ts`; modelo em `src/modules/orders/order.schemas.ts` | Schemas Zod no módulo novo | `[09:23] Sofia`, `[09:30] Larissa` |

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Motivo da rejeição | Fonte |
|---|---|---|---|---|---|
| ADR-006-ALT-01 | Infraestrutura própria para a feature, com logger e tratamento de erros separados | Isolaria a feature do restante | Duplicaria o que já existe e adicionaria dependências | Contraria "não vamos botar nada novo" | ⚠️ Alternativa plausível, não discutida na reunião (ver INF-20); apoio em `[09:29] Bruno` |

## Consequências

### Positivas

- O módulo novo segue uma estrutura já conhecida pelo time (`[09:27] Bruno`).
- Sem novas dependências de log (`[09:29] Bruno`).
- As rotas novas retornam erros no mesmo formato `{ error: { code, message, details? } }` das demais (`src/middlewares/error.middleware.ts`).

### Negativas

O reuso tem limites, identificados na leitura do código, que a reunião não abordou:

- **Código fixo em `NotFoundError`:** a classe sempre usa `NOT_FOUND` (`src/shared/errors/http-errors.ts`). `WEBHOOK_NOT_FOUND` (`[09:28] Bruno`) precisa de outra classe, como já acontece em `InsufficientStockError`.
- **Validação com código fixo:** `validate` converte toda falha de Zod em `ValidationError`, com `VALIDATION_ERROR` (`src/middlewares/validate.middleware.ts`). Aplicado ali, o schema nunca emitiria `WEBHOOK_INVALID_URL` (`[09:23] Sofia`, `[09:28] Bruno`). Ver INF-08.
- **O worker não passa pelo `errorMiddleware`:** o middleware só atende requisições HTTP (`src/app.ts`). A afirmação de que ele "vai pegar nossos erros" (`[09:29] Bruno`) não vale para o processo do worker, que trata os próprios erros.
- **Logger pouco usado nos módulos:** apesar de "já tá no projeto inteiro" (`[09:29] Bruno`), hoje só `src/server.ts`, `src/middlewares/request-logger.middleware.ts` e `src/middlewares/error.middleware.ts` o importam. O módulo de webhooks será o primeiro em `src/modules` a usá-lo.
- **Mascaramento de `secret`:** o logger compartilhado não cobre esse campo; ver [ADR-004](./ADR-004-assinatura-hmac-com-secret-por-endpoint.md).

### Trade-off explícito

Aceitamos os limites dos padrões atuais, com ajustes pontuais no módulo novo, em troca do mesmo formato `{ error: { code, message, details? } }` e da estrutura controller, service, repository, routes e schemas (`[09:27] Bruno`), sem dependência nova.

## Referências

- [ADR-002: Worker separado em polling](./ADR-002-worker-separado-em-polling.md)
- [ADR-004: Assinatura HMAC](./ADR-004-assinatura-hmac-com-secret-por-endpoint.md)
- [ADR-008: Controle de acesso da API de webhooks](./ADR-008-controle-de-acesso-da-api-de-webhooks.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-08.** Um schema Zod de URL é aplicado no service, que lança `WEBHOOK_INVALID_URL`. `validate` e o `errorMiddleware` não mudam. Apoio: `[09:23] Sofia`, `[09:28] Bruno`, `src/middlewares/validate.middleware.ts`.

> ⚠️ Inferência (sem fonte direta): **INF-09.** `WEBHOOK_SECRET_REQUIRED`, citado em `[09:28] Bruno`, fica de fora porque a secret é sempre gerada pelo sistema (`[09:31] Marcos`).

> ⚠️ Inferência (sem fonte direta): **INF-20.** A alternativa ADR-006-ALT-01 não foi discutida na reunião. Foi incluída porque nenhuma alternativa ao reuso foi debatida e o formato do ADR pede ao menos uma, real ou plausível. Apoio: `[09:29] Bruno`.
