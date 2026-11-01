# Inventário — Etapa 1 (rascunho de trabalho)

> Fonte de verdade das etapas 2 a 6. Não faz parte do pacote de design docs. Toda linha cita `[hh:mm] Nome` de `TRANSCRICAO.md` ou um caminho real do repositório.

## Falantes da transcrição

| Falante | Papel |
|---|---|
| Larissa | Tech Lead, conduz a reunião |
| Marcos | Product Manager |
| Bruno | Engenheiro Pleno, time de Pedidos |
| Diego | Engenheiro Sênior, time de Plataforma |
| Sofia | Engenheira de Segurança |

Fonte: cabeçalho de `TRANSCRICAO.md`. Diego entrou às 09:05, e Marcos e Sofia saíram às 09:50, antes das decisões sobre UUID e snapshot.

## Caminhos de arquivo confirmados

Lista para reuso nas próximas etapas. Todos foram conferidos por script. Arquivos planejados, como `src/worker.ts` e `src/modules/webhooks`, **não existem** e devem ser citados sempre como novos.

- **Raiz:** `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`, `docker-compose.yml`, `.env.example`, `.eslintrc.json`, `.gitignore`, `TRANSCRICAO.md`
- **Aplicação:** `src/app.ts`, `src/server.ts`, `src/routes/index.ts`, `src/config/database.ts`, `src/config/env.ts`
- **Middlewares:** `src/middlewares/auth.middleware.ts`, `src/middlewares/error.middleware.ts`, `src/middlewares/request-logger.middleware.ts`, `src/middlewares/validate.middleware.ts`
- **Compartilhado:** `src/shared/errors/app-error.ts`, `src/shared/errors/http-errors.ts`, `src/shared/errors/index.ts`, `src/shared/http/response.ts`, `src/shared/logger/index.ts`
- **Pedidos:** `src/modules/orders/order.controller.ts`, `src/modules/orders/order.repository.ts`, `src/modules/orders/order.routes.ts`, `src/modules/orders/order.schemas.ts`, `src/modules/orders/order.service.ts`, `src/modules/orders/order.status.ts`
- **Auth:** `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.schemas.ts`, `src/modules/auth/auth.service.ts`
- **Usuários:** `src/modules/users/user.controller.ts`, `src/modules/users/user.repository.ts`, `src/modules/users/user.routes.ts`, `src/modules/users/user.schemas.ts`, `src/modules/users/user.service.ts`
- **Clientes:** `src/modules/customers/customer.controller.ts`, `src/modules/customers/customer.repository.ts`, `src/modules/customers/customer.routes.ts`, `src/modules/customers/customer.schemas.ts`, `src/modules/customers/customer.service.ts`
- **Produtos:** `src/modules/products/product.controller.ts`, `src/modules/products/product.repository.ts`, `src/modules/products/product.routes.ts`, `src/modules/products/product.schemas.ts`, `src/modules/products/product.service.ts`
- **Banco:** `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20260519182739_init/migration.sql`, `prisma/migrations/migration_lock.toml`
- **Testes:** `tests/setup.ts`, `tests/auth.test.ts`, `tests/orders.test.ts`, `tests/helpers/factories.ts`

## Parte A — Exploração do código

### Arquivos abertos

Abertos diretamente na sessão principal:

- **Aplicação:** `src/app.ts`, `src/server.ts`, `src/routes/index.ts`
- **Configuração:** `src/config/database.ts`, `src/config/env.ts`, `package.json`, `.env.example`, `docker-compose.yml`, `vitest.config.ts`
- **Middlewares:** `src/middlewares/auth.middleware.ts`, `src/middlewares/error.middleware.ts`, `src/middlewares/request-logger.middleware.ts`, `src/middlewares/validate.middleware.ts`
- **Compartilhado:** `src/shared/errors/app-error.ts`, `src/shared/errors/http-errors.ts`, `src/shared/errors/index.ts`, `src/shared/http/response.ts`, `src/shared/logger/index.ts`
- **Pedidos:** `src/modules/orders/order.controller.ts`, `src/modules/orders/order.repository.ts`, `src/modules/orders/order.routes.ts`, `src/modules/orders/order.schemas.ts`, `src/modules/orders/order.service.ts`, `src/modules/orders/order.status.ts`
- **Auth e usuários:** `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.schemas.ts`, `src/modules/auth/auth.service.ts`, `src/modules/users/user.routes.ts`, `src/modules/users/user.service.ts`
- **Clientes:** `src/modules/customers/customer.routes.ts`, `src/modules/customers/customer.service.ts`
- **Banco:** `prisma/schema.prisma`, `prisma/seed.ts`
- **Testes:** `tests/setup.ts`, `tests/helpers/factories.ts`, `tests/orders.test.ts` (linhas 1 a 90)

Abertos só pelos subagentes Explore: os demais arquivos dos módulos `auth`, `users`, `customers` e `products`, `prisma/migrations/20260519182739_init/migration.sql`, `prisma/migrations/migration_lock.toml`, `tests/auth.test.ts`, `tsconfig.json`, `tsconfig.build.json`, `.eslintrc.json` e `.gitignore`. Esses precisam ser abertos de novo antes de serem citados em detalhe em um documento (R3).

### Estrutura e padrões

| Tema | Como funciona hoje | Onde |
|---|---|---|
| Módulos | Cada domínio tem `*.routes`, `*.controller`, `*.service`, `*.repository` e `*.schemas`. Pedidos tem também `order.status.ts` | `src/modules/orders/` |
| Composição | Instanciação manual de repository → service → controller em `buildControllers` | `src/app.ts` |
| Rotas | `buildApiRouter` monta os routers de cada módulo; a API fica sob `/api/v1` | `src/routes/index.ts`, `src/app.ts` |
| Autenticação | `authenticate` valida o JWT; o token carrega `sub`, `email` e `role`, sem cliente | `src/middlewares/auth.middleware.ts` |
| Autorização | `requireRole('ADMIN')` após `authenticate`; hoje só é usado em uma rota | `src/modules/users/user.routes.ts` |
| Validação | `validate({ body, query, params })` com Zod; falha vira `ValidationError` com código `VALIDATION_ERROR` | `src/middlewares/validate.middleware.ts` |
| Erros | `AppError` + subclasses HTTP. `BadRequestError`, `ConflictError` e `UnprocessableEntityError` aceitam código; `NotFoundError` e `ValidationError` têm código fixo | `src/shared/errors/http-errors.ts` |
| Resposta de erro | `{ error: { code, message, details? } }`; trata `AppError`, `ZodError` e Prisma `P2002`/`P2025`; o resto vira 500 | `src/middlewares/error.middleware.ts` |
| Logger | Pino com `redact` para `authorization`, `cookie`, `password`, `passwordHash`, `token`, `accessToken`; `service` fixo em `order-management-api` | `src/shared/logger/index.ts` |
| Correlação | `X-Request-Id` recebido ou gerado por requisição, registrado no log `http_request` | `src/middlewares/request-logger.middleware.ts` |
| Env | Zod valida no carregamento e encerra o processo se faltar `DATABASE_URL` ou `JWT_SECRET` | `src/config/env.ts` |
| Prisma | `createPrismaClient()` e singleton `prisma` por processo | `src/config/database.ts` |
| Paginação | `paginated()`; a listagem de pedidos limita `pageSize` a 100 | `src/shared/http/response.ts`, `src/modules/orders/order.schemas.ts` |
| Entry-point | `bootstrap()` com encerramento por `SIGINT`/`SIGTERM` | `src/server.ts` |
| Testes | Vitest + Supertest contra banco real, em execução serial; `beforeEach` limpa as tabelas em ordem de FK | `vitest.config.ts`, `tests/setup.ts`, `tests/helpers/factories.ts` |

### Limitações transversais que afetam a feature

- **Logs nos módulos:** nenhum arquivo de `src/modules` usa `logger`. O log hoje está em `src/server.ts`, `src/middlewares/request-logger.middleware.ts` e `src/middlewares/error.middleware.ts`.
- **Correlação:** o `requestId` não chega aos services, pois não há `AsyncLocalStorage` nem `logger.child`.
- **`pino-http`:** está declarado em `package.json`, mas não é importado em `src/`.
- **Erros do Prisma:** `src/middlewares/error.middleware.ts` trata `P2002` e `P2025`; `P2003` (violação de FK) cai em 500. Uma FK nova para `customers` pode afetar a exclusão de clientes, que hoje só checa a existência do registro (`src/modules/customers/customer.service.ts`).
- **Limpeza de dados:** `tests/setup.ts` e `prisma/seed.ts` têm listas independentes de `deleteMany`, e toda tabela nova precisa entrar nas duas.
- **Testes:** usam o banco apontado por `DATABASE_URL`, sem mocks e sem banco exclusivo, e nenhum exercita `requireRole`.

### Ciclo de vida do pedido

- **Máquina de estados** (`src/modules/orders/order.status.ts`): `PENDING → PAID | CANCELLED`, `PAID → PROCESSING | CANCELLED`, `PROCESSING → SHIPPED | CANCELLED`, `SHIPPED → DELIVERED`. `DELIVERED` e `CANCELLED` são terminais.
- **Mudança de status** (`OrderService.changeStatus` em `src/modules/orders/order.service.ts`, exposto por `PATCH /api/v1/orders/:id/status`): dentro de `prisma.$transaction`, lê o pedido, valida a transição, ajusta o estoque, atualiza `orders`, insere em `order_status_history` e relê o pedido.
- **Sem controle de concorrência:** `changeStatus` não usa lock nem coluna de versão. Requisições simultâneas poderiam gerar transições e eventos duplicados (interpretação da leitura, não reproduzida).
- **Estoque:** debita só em `PENDING → PAID` e repõe em `PAID|PROCESSING → CANCELLED`. `SHIPPED` não pode ir para `CANCELLED`.
- **Auditoria:** `OrderStatusHistory` guarda `fromStatus`, `toStatus`, `changedById`, `changedAt` e `reason`.
- **Criação:** `OrderService.create` grava o histórico inicial direto, sem passar por `changeStatus`.
- **Exclusão:** `OrderService.delete` permite apagar pedidos `PENDING` ou `CANCELLED`; `items` e `history` caem em cascata.

### Modelos relevantes (`prisma/schema.prisma`)

- `User`: `role` é `ADMIN` ou `OPERATOR`. **Não tem relação com `Customer`.**
- `Customer`, `Order` (`orderNumber`, `customerId`, `status`, `totalCents`), `OrderStatusHistory`.
- Convenção: `id` UUID em `Char(36)`, `createdAt`/`updatedAt`, `@@map` em snake_case, mas colunas em camelCase.

### O que não existe hoje

A busca em `src/`, `prisma/` e `tests/` não encontrou eventos, filas, webhooks, outbox, Redis, envio de e-mail, `setInterval`, `crypto`, cliente HTTP (`fetch`, `axios`), métricas ou tracing. A migration inicial não tem triggers.

A feature se encaixa em três pontos: dentro da transação de `changeStatus`, em um novo módulo `src/modules/webhooks` e em um novo entry-point `src/worker.ts`.

## Parte B — Resumo da transcrição

1. Atlas Comercial, MaxDistribuição e Nova Cargo pedem notificação de status em vez de polling em `GET /orders` (`[09:00] Marcos`).
2. "Tempo real" significa menos de 10 segundos, e o fluxo é só de saída (`[09:02] Marcos`).
3. Bruno e Diego descartam o envio síncrono; Diego propõe a outbox e Larissa fecha em MySQL (`[09:08] Larissa`).
4. Diego define o worker em polling de 2s, em processo separado; Larissa registra a decisão (`[09:10] Larissa`).
5. A ordem vale só por pedido e com um único worker, como limitação conhecida (`[09:13] Larissa`).
6. Diego propõe a política de retry e a DLQ em tabela própria; Larissa fecha 5 tentativas (`[09:17] Larissa`).
7. Sofia define HMAC-SHA256, secret por endpoint, rotação com 24h, HTTPS e limite de payload (`[09:22] Sofia`, `[09:23] Sofia`).
8. Diego define at-least-once com `X-Event-Id`; Larissa fecha, e Marcos documenta no portal (`[09:26] Larissa`).
9. Bruno define o reuso dos padrões e a função `publishWebhookEvent`; Larissa fecha o reuso (`[09:30] Larissa`, `[09:41] Bruno`).
10. Marcos lista os requisitos; Larissa corta e-mail e dashboard, deixa rate limiting em observação e estima 3 sprints (`[09:48] Larissa`).

## Parte C — Inventário

### A) Decisões fechadas

| # | Decisão | Quem/quando | Justificativa citada |
|---|---|---|---|
| D1 | Envio não é síncrono no service de pedidos | `[09:04] Bruno`, `[09:06] Diego` | Cliente lento travaria a transação; cliente fora do ar não pode causar rollback |
| D2 | Padrão outbox no MySQL existente, na mesma transação | `[09:06] Diego`, `[09:08] Larissa`, `[09:48] Larissa` | Commit registra o evento; rollback o descarta |
| D3 | Worker em polling a cada 2s | `[09:09] Diego`, `[09:10] Larissa` | MySQL não tem listener nativo; 2s atende aos 10s |
| D4 | Worker em processo separado, `src/worker.ts`, `npm run worker` | `[09:11] Diego`, `[09:11] Larissa`, `[09:28] Bruno` | Reinício da API não pode derrubar o worker |
| D5 | Mesmo banco e `DATABASE_URL`, com `PrismaClient` próprio | `[09:11] Diego`, `[09:30] Bruno` | `PrismaClient` é por processo |
| D6 | Um único worker; ordem só por `order_id`; limitação conhecida | `[09:12] Diego`, `[09:13] Larissa` | Clientes não pediram ordem global (`[09:14] Marcos`) |
| D7 | 5 tentativas com backoff 1m/5m/30m/2h/12h | `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa` | Cobre indisponibilidades longas, como manutenção de 2h (`[09:16] Diego`) |
| D8 | DLQ em tabela separada `webhook_dead_letter` | `[09:18] Diego`, `[09:48] Larissa` | Leitura da outbox mais limpa; evidência para debug e replay |
| D9 | Replay manual por endpoint admin, recolocando como pendente | `[09:18] Diego`, `[09:19] Larissa` | Reprocessamento controlado |
| D10 | HMAC-SHA256 sobre o corpo, enviado em `X-Signature` | `[09:20] Sofia`, `[09:22] Sofia` | Cliente valida origem e integridade (`[09:19] Sofia`) |
| D11 | Secret única por endpoint | `[09:21] Sofia`, `[09:22] Sofia` | Com secret global, "se vaza uma, vaza tudo" |
| D12 | Secret rotacionável pela API, com 24h de carência | `[09:21] Sofia`, `[09:22] Sofia` | Tempo de migração; já houve vazamento (`[09:22] Diego`) |
| D13 | At-least-once com `X-Event-Id`; dedup no cliente | `[09:24] Diego`, `[09:25] Diego`, `[09:26] Larissa` | Exactly-once exigiria coordenação dos dois lados |
| D14 | Reuso de `AppError`, Pino, error middleware, módulos, Zod e códigos | `[09:30] Larissa` | Webhook é um módulo como os outros |
| D15 | Código em `src/modules/webhooks`; processamento em arquivo do módulo | `[09:27] Bruno`, `[09:28] Bruno` | Segue o padrão de módulos |
| D16 | Prefixo `WEBHOOK_` em todo o módulo | `[09:28] Bruno`, `[09:29] Larissa` | Segue o padrão de códigos |
| D17 | `customer_id` vem no body ou no path, não do JWT | `[09:32] Larissa` | O JWT é do usuário, não do cliente (`[09:32] Bruno`) |
| D18 | Filtro de status aplicado na inserção da outbox | `[09:33] Marcos`, `[09:34] Bruno`, `[09:34] Diego` | Economiza linhas na tabela |
| D19 | `publishWebhookEvent(tx, order, fromStatus, toStatus)` em `changeStatus`; falha na outbox causa rollback | `[09:40] Bruno`, `[09:41] Bruno`, `[09:41] Diego` | Não pode haver status alterado sem evento |
| D20 | Replay exige role ADMIN, com `requireRole` | `[09:36] Sofia`, `[09:36] Larissa` | Fila de entrega não é assunto de operador |
| D21 | Demais endpoints: qualquer role autenticada, por enquanto | `[09:36] Marcos`, `[09:37] Sofia` | Pode endurecer depois |
| D22 | IDs da outbox em UUID | `[09:51] Diego`, `[09:51] Larissa` | Padrão do projeto |
| D23 | Payload renderizado (snapshot) na inserção | `[09:51] Bruno`, `[09:52] Larissa`, `[09:52] Diego`, `[09:52] Bruno` | O evento reflete o estado do momento da mudança |
| D24 | Webhooks só de saída | `[09:02] Sofia`, `[09:02] Marcos`, `[09:03] Sofia` | Clientes só querem receber |

### B) Requisitos funcionais explícitos

| # | Requisito | Fonte |
|---|---|---|
| F1 | Notificar o cliente quando o status do pedido muda | `[09:00] Marcos` |
| F2 | Cadastrar webhook por POST: `url` e lista de status; secret gerada pelo sistema e devolvida na criação | `[09:31] Marcos` |
| F3 | Editar por PATCH | `[09:33] Bruno` |
| F4 | Remover por DELETE | `[09:33] Bruno` |
| F5 | Listar por GET os webhooks de um cliente | `[09:33] Bruno` |
| F6 | Cada endpoint escolhe os status que quer receber | `[09:33] Bruno`, `[09:33] Marcos` |
| F7 | Não inserir evento se nenhum webhook do cliente quer aquele status | `[09:34] Bruno` |
| F8 | Histórico em `GET /webhooks/:id/deliveries`: sucesso/falha, payload, response, tempo de resposta | `[09:34] Marcos` |
| F9 | Pedir nova secret pela API | `[09:21] Sofia` |
| F10 | Recusar URL `http` com erro de validação | `[09:23] Sofia` |
| F11 | Entregar pelo worker com retry; ao esgotar, mover para a DLQ | `[09:15] Diego`, `[09:48] Larissa` |
| F12 | Replay em `POST /admin/webhooks/dead-letter/:id/replay` | `[09:18] Diego`, `[09:35] Diego` |
| F13 | Registrar em log quem fez o replay | `[09:36] Sofia` |
| F14 | Documentar a integração e o at-least-once no portal de desenvolvedor | `[09:26] Marcos`, `[09:40] Marcos` |

### C) Requisitos não funcionais e restrições

| # | Item | Valor citado | Fonte |
|---|---|---|---|
| N1 | Latência percebida como tempo real | Menos de 10s | `[09:02] Marcos` |
| N2 | Intervalo de polling | 2s | `[09:09] Diego`, `[09:10] Larissa` |
| N3 | Timeout da chamada HTTP | 10s; acima disso é falha e vai para retry | `[09:42] Diego` |
| N4 | Limite de payload | 64KB; erro se ultrapassar, sem truncar | `[09:23] Sofia`, `[09:24] Diego`, `[09:24] Larissa` |
| N5 | Transporte | Somente HTTPS | `[09:23] Sofia` |
| N6 | Índices da outbox | `status` e `created_at` | `[09:08] Diego` |
| N7 | Leitura da outbox | Pendentes mais antigos, em batch pequeno (sem número) | `[09:08] Diego`, `[09:09] Diego` |
| N8 | Payload enxuto | Sem `items` | `[09:43] Diego`, `[09:44] Bruno` |
| N9 | Nenhuma dependência nova de log | Pino | `[09:29] Bruno` |
| N10 | Infraestrutura | Nada além do MySQL existente | `[09:07] Diego` |
| N11 | Revisão de segurança antes do deploy | Pelo menos 2 dias úteis | `[09:46] Sofia`, `[09:49] Sofia` |
| N12 | Prazo interno | 3 sprints com a revisão incluída | `[09:47] Larissa` |
| N13 | Prazo do cliente | Fim de novembro (antes citado como fim do trimestre) | `[09:45] Marcos`, `[09:00] Marcos` |

### D) Alternativas descartadas

| # | Alternativa | Motivo do descarte | Fonte |
|---|---|---|---|
| X1 | Chamada HTTP síncrona na transação | Cliente lento trava outras mudanças; indisponibilidade não pode causar rollback | `[09:04] Bruno`, `[09:06] Diego` |
| X2 | Redis Streams / Redis Cluster | Mais infraestrutura para um time pequeno; overengineering | `[09:07] Larissa`, `[09:07] Diego` |
| X3 | Trigger no banco para notificar o worker | Trigger só executa SQL; exigiria improviso | `[09:09] Bruno`, `[09:09] Diego` |
| X4 | Worker dentro do processo da API | Reinício da API derrubaria o worker | `[09:11] Diego` |
| X5 | Retry indefinido | Evento ficaria pendurado para sempre | `[09:15] Diego` |
| X6 | 3 tentativas | Janela de 30 minutos não cobre manutenção de 2h | `[09:16] Bruno`, `[09:16] Diego` |
| X7 | Marcar `failed` na própria outbox em vez de tabela separada | Leitura menos limpa; perde a evidência separada | `[09:17] Larissa`, `[09:18] Diego` |
| X8 | Secret global da plataforma | Um vazamento comprometeria todos | `[09:21] Sofia` |
| X9 | Truncar payload acima do limite | Tamanho excessivo indica erro; melhor falhar | `[09:23] Sofia` |
| X10 | Exactly-once | Exige coordenação dos dois lados e é mais complexo | `[09:25] Diego` |
| X11 | `customer_id` implícito no JWT | O JWT é do usuário operador | `[09:31] Marcos`, `[09:32] Bruno`, `[09:32] Larissa` |
| X12 | Filtrar status na hora do envio | Geraria linhas desnecessárias | `[09:34] Diego`, `[09:34] Bruno` |
| X13 | Injetar repository no `OrderService` | Função recebendo `tx` basta | `[09:41] Bruno`, `[09:41] Diego` |
| X14 | Compartilhar instância de `PrismaClient` entre API e worker | São processos diferentes | `[09:29] Diego`, `[09:30] Bruno` |
| X15 | ID autoincremental | O projeto usa UUID | `[09:51] Diego`, `[09:51] Larissa` |
| X16 | Renderizar o payload no envio | O pedido pode mudar depois | `[09:51] Bruno`, `[09:52] Larissa` |

### E) Itens adiados ou fora de escopo

| # | Item | Situação | Fonte |
|---|---|---|---|
| A1 | E-mail ao cliente quando o webhook falha | Próxima fase, após medir impacto | `[09:37] Marcos`, `[09:37] Larissa`, `[09:38] Marcos` |
| A2 | Dashboard visual | Fora de escopo; projeto separado do frontend | `[09:39] Marcos`, `[09:40] Larissa` |
| A3 | Arquivar entregues após cerca de 30 dias | Fora do escopo desta feature | `[09:08] Diego` |
| A4 | Múltiplos workers (partição por `order_id` ou lock pessimista) | Problema do futuro | `[09:13] Diego` |
| A5 | Webhooks de entrada | Fora de escopo | `[09:02] Marcos` |

### F) Questões em aberto na reunião

| # | Questão | Quem levantou | Fonte |
|---|---|---|---|
| Q1 | Rate limiting de saída: observar e decidir depois | Diego | `[09:38] Diego`, `[09:39] Diego`, `[09:39] Larissa` |
| Q2 | Endurecer as permissões do CRUD de webhooks | Marcos e Sofia | `[09:36] Marcos`, `[09:37] Sofia` |
| Q3 | `customer_id` no body ou no path | Larissa | `[09:32] Larissa` |
| Q4 | Nome do arquivo: `webhook.worker.ts` ou `webhook.processor.ts` | Bruno | `[09:28] Bruno` |
| Q5 | Janela exata de arquivamento ("30 dias ou assim") | Diego | `[09:08] Diego` |
| Q6 | Confirmação do prazo com a Atlas | Marcos | `[09:47] Marcos` |

### G) Detalhes técnicos secundários

| # | Detalhe | Fonte |
|---|---|---|
| S1 | Campos do payload: `event_id`, `event_type`, `timestamp` (ISO 8601), `order_id`, `order_number`, `from_status`, `to_status`, `customer_id`, campos básicos como `total_cents` | `[09:43] Diego` |
| S2 | `event_type` de exemplo: `order.status_changed` | `[09:43] Diego` |
| S3 | Headers: `X-Event-Id`, `X-Signature`, `X-Timestamp`, `Content-Type: application/json` | `[09:44] Diego` |
| S4 | Header `X-Webhook-Id` | `[09:44] Sofia`, `[09:45] Diego` |
| S5 | `X-Timestamp` é o momento do envio, para detecção opcional de replay | `[09:44] Diego` |
| S6 | `X-Event-Id` é UUID gerado na entrada da outbox, único por evento | `[09:25] Diego` |
| S7 | Status da outbox: pendente, processando, falhou, entregue | `[09:08] Diego` |
| S8 | Tabelas nomeadas: `webhook_outbox`, `webhook_dead_letter` | `[09:06] Diego`, `[09:18] Diego` |
| S9 | Configuração guarda `url`, `secret`, `customer_id` e estado ativo | `[09:21] Bruno`, `[09:21] Sofia` |
| S10 | DLQ guarda payload, motivo da falha e timestamp | `[09:18] Diego` |
| S11 | Códigos citados: `WEBHOOK_NOT_FOUND`, `WEBHOOK_INVALID_URL`, `WEBHOOK_SECRET_REQUIRED` | `[09:28] Bruno` |
| S12 | Exemplo de histórico: "últimos 100 webhooks" | `[09:34] Marcos` |
| S13 | Para detalhes, o cliente consulta `GET /orders/:id` | `[09:43] Diego` |

### H) Ganchos com o código

| Ponto citado na reunião | Arquivo real | Método/classe real | Observação da leitura |
|---|---|---|---|
| Inserir na outbox em `changeStatus` (`[09:40] Bruno`) | `src/modules/orders/order.service.ts` | `OrderService.changeStatus` | `tx` é `Prisma.TransactionClient`, com alias `TxClient` |
| Entry-point como o da API (`[09:11] Larissa`) | `src/server.ts` | `bootstrap` | Modelo para `src/worker.ts`, incluindo o encerramento |
| Script `npm run worker` (`[09:11] Larissa`) | `package.json` | `scripts` | Hoje há `dev`, `build` e `start`, só para a API |
| Estrutura de módulo (`[09:27] Bruno`) | `src/modules/orders/` | `order.*` | Molde para `src/modules/webhooks` |
| `AppError` e códigos (`[09:28] Bruno`) | `src/shared/errors/app-error.ts`, `src/shared/errors/http-errors.ts` | `AppError`, `InsufficientStockError`, `InvalidStatusTransitionError` | `NotFoundError` e `ValidationError` não aceitam código |
| Pino (`[09:29] Bruno`) | `src/shared/logger/index.ts` | `logger`, `redactPaths` | `redactPaths` não cobre `secret` |
| Error middleware (`[09:29] Bruno`) | `src/middlewares/error.middleware.ts` | `errorMiddleware` | Cobre só HTTP; o worker trata os próprios erros |
| `PrismaClient` por processo (`[09:30] Bruno`) | `src/config/database.ts` | `createPrismaClient`, `prisma` | O singleton já dá uma instância por processo |
| Schemas Zod (`[09:23] Sofia`, `[09:30] Larissa`) | `src/middlewares/validate.middleware.ts`, `src/modules/orders/order.schemas.ts` | `validate` | Falha sempre vira `VALIDATION_ERROR` |
| `requireRole` (`[09:36] Larissa`) | `src/middlewares/auth.middleware.ts`, `src/modules/users/user.routes.ts` | `requireRole`, `authenticate` | Modelo de uso em `user.routes.ts` |
| Pasta e rotas novas (`[09:27] Bruno`) | `src/routes/index.ts`, `src/app.ts` | `buildApiRouter`, `Controllers`, `buildControllers` | As rotas ficam sob `/api/v1` |
| Tabelas citadas (`[09:04] Bruno`, `[09:06] Diego`) | `prisma/schema.prisma` | `Order`, `OrderStatusHistory`, `Product` | Novos modelos entram aqui |
| Status filtráveis (`[09:33] Marcos`) | `src/modules/orders/order.status.ts`, `prisma/schema.prisma` | `transitions`, `OrderStatus` | Nenhuma transição leva a `PENDING` |

### I) Números citados que podem virar métrica

| Métrica | Meta | Fonte |
|---|---|---|
| Latência entre a mudança de status e a notificação | Menos de 10s | `[09:02] Marcos` |
| Intervalo de polling | 2s | `[09:10] Larissa` |
| Janela de retry entre a primeira falha e a última tentativa | Quase 15h (a soma dá 14h36) | `[09:17] Diego` |
| Clientes solicitantes atendidos | 3 (Atlas, MaxDistribuição, Nova Cargo) | `[09:00] Marcos` |
| Prazo de entrega | 3 sprints; Atlas pede fim de novembro | `[09:47] Larissa`, `[09:45] Marcos` |

Nenhuma taxa de sucesso de entrega foi citada, e não será criada.

## Cobertura das 6 decisões principais

| # | Decisão | Coberta? | Onde |
|---|---|---|---|
| 1 | Outbox no MySQL | Sim | `[09:06] Diego`, `[09:08] Larissa` |
| 2 | Retry com backoff + DLQ | Sim | `[09:15] Diego`, `[09:17] Larissa`, `[09:18] Diego` |
| 3 | HMAC-SHA256 com secret por endpoint | Sim | `[09:21] Sofia`, `[09:22] Sofia` |
| 4 | At-least-once com `X-Event-Id` | Sim | `[09:25] Diego`, `[09:26] Larissa` |
| 5 | Worker separado em polling | Sim | `[09:10] Larissa`, `[09:11] Diego` |
| 6 | Reuso dos padrões existentes | Sim | `[09:30] Larissa` |

## Divergências entre a fala e o código ou entre falas

| # | O que foi dito | O que se verifica | Tratamento |
|---|---|---|---|
| V1 | "Usar o mesmo Prisma client" (`[09:11] Bruno`) | Corrigido depois: instância separada (`[09:30] Bruno`) | Vale a segunda fala |
| V2 | "Latência mínima de 2 segundos no pior caso" (`[09:10] Larissa`) | Termos contraditórios; 2s é o intervalo de polling | Registrar 2s como intervalo, sem chamar de latência mínima |
| V3 | A transação "decrementa stock_quantity" (`[09:04] Bruno`) | Só em `PENDING → PAID`; também repõe no cancelamento (`src/modules/orders/order.status.ts`) | Descrever pelo código |
| V4 | "Trigger no banco a gente até tem" (`[09:09] Diego`) | A migration não tem triggers; a fala parece se referir ao recurso do MySQL | Não afirmar que existem triggers |
| V5 | "Usuários que representam o cliente" (`[09:32] Marcos`) | `User` não tem vínculo com `Customer` (`prisma/schema.prisma`) | Risco; ver ambiguidade 5 |
| V6 | O middleware "vai pegar nossos erros" (`[09:29] Bruno`) | Vale para HTTP com subclasses de `AppError`; não alcança o worker | Registrar a ressalva no FDD |
| V7 | "Estamos a uma hora de reunião" (`[09:27] Larissa`) | Passaram 27 minutos pelos timestamps | Irrelevante; não usar |

## Ambiguidades

**Situação:** todas as recomendações abaixo foram aceitas por Juliano em 2026-10-31. O resultado está em "Inferências adotadas", no fim deste arquivo.

### Afetam os ADRs

| # | Ambiguidade | Fontes | Recomendação |
|---|---|---|---|
| 1 | "5 tentativas" é o total ou são 5 reenvios? Com 5 intervalos e "quase 15h entre primeira falha e última tentativa", a conta dá 1 envio + 5 reenvios | `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa` | 1 envio inicial + 5 reenvios (6 chamadas HTTP), marcado como `⚠️ Inferência` |
| 2 | Onde o limite de 64KB é aplicado? Na inserção, o erro faria rollback da mudança de status | `[09:23] Sofia`, `[09:24] Larissa`, `[09:40] Bruno` | No worker, antes do envio: não envia e move direto para a DLQ com o motivo |
| 3 | Na carência de 24h, qual secret assina? Com uma só assinatura, a "validade em paralelo" não funciona para todos os clientes | `[09:21] Sofia`, `[09:22] Sofia`, `[09:44] Diego` | `X-Signature` leva as duas assinaturas durante a carência, com `⚠️ Inferência` e item para a revisão da Sofia |
| 4 | Cliente com vários endpoints: uma linha por endpoint? `event_id` compartilhado? | `[09:25] Diego`, `[09:34] Bruno`, `[09:44] Sofia` | Uma linha e um `event_id` por endpoint interessado, pois cada entrega tem retry próprio |
| 5 | Dois furos do código afetam a segurança: `/auth/register` é público e aceita `role: ADMIN`, e `User` não tem vínculo com `Customer`. Assim, o requisito de ADMIN pode ser contornado e não há isolamento entre clientes | `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.schemas.ts`, `prisma/schema.prisma`, `[09:36] Larissa`, `[09:37] Sofia` | Registrar como risco e pré-condição para a revisão da Sofia, sem propor mudança de código nesta entrega |
| 6 | O retry quebra a ordem? Um evento em backoff pode ser ultrapassado pelo seguinte do mesmo pedido | `[09:12] Diego`, `[09:13] Larissa` | Ampliar a limitação conhecida: a ordem vale só sem retry. Não inventar bloqueio por pedido |
| 7 | Um worker sequencial com timeout de 10s pode estourar a meta de 10s: um cliente fora do ar atrasa os demais | `[09:02] Marcos`, `[09:12] Diego`, `[09:42] Diego` | Manter sequencial, como decidido, e registrar como risco e questão em aberto no RFC |
| 8 | O que significa o status "falhou", se a falha definitiva vai para outra tabela? | `[09:08] Diego`, `[09:17] Larissa`, `[09:18] Diego` | `pendente` inclui quem aguarda retry; `falhou` marca a linha esgotada, já copiada para a DLQ; o replay a devolve a `pendente` |

### Afetam só o RFC, o FDD ou o PRD

| # | Ambiguidade | Fontes | Recomendação |
|---|---|---|---|
| 9 | `customer_id` no body ou no path (Q3) | `[09:32] Larissa`, `src/modules/orders/order.schemas.ts` | Body no POST, como em `createOrderSchema`; path na listagem: `GET /customers/:customerId/webhooks` |
| 10 | `WEBHOOK_INVALID_URL` nunca seria emitido, pois a falha de Zod vira `VALIDATION_ERROR` | `[09:23] Sofia`, `[09:28] Bruno`, `src/middlewares/validate.middleware.ts` | Schema Zod de URL aplicado no service, que lança `WEBHOOK_INVALID_URL`; atende às duas falas sem alterar o middleware |
| 11 | `WEBHOOK_SECRET_REQUIRED` não tem uso, pois a secret é sempre gerada pelo sistema | `[09:28] Bruno`, `[09:31] Marcos` | Não incluir na matriz, e explicar o motivo em nota |
| 12 | O exemplo `WEBHOOK_ENDPOINT_NOT_FOUND` do prompt difere da reunião | `docs/desafio/prompt_docs.md`, `[09:28] Bruno` | Usar `WEBHOOK_NOT_FOUND` |
| 13 | `PENDING` no filtro de status nunca dispara, e a criação do pedido não gera evento | `src/modules/orders/order.status.ts`, `src/modules/orders/order.service.ts`, `[09:40] Bruno` | Aceitar no filtro só `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| 14 | FK da outbox para `orders` impediria excluir pedidos `CANCELLED` com evento e afeta a limpeza em `tests/setup.ts` e `prisma/seed.ts` | `src/modules/orders/order.service.ts`, `tests/setup.ts`, `prisma/seed.ts` | Sem FK para `orders`, pois o payload já é um snapshot |
| 15 | Replay: mantém o `event_id`? Zera as tentativas? | `[09:18] Diego`, `[09:25] Diego` | Mantém o `event_id` e reinicia as tentativas, com `⚠️ Inferência` |
| 16 | Autor e data do RFC e dos ADRs: a transcrição só diz "quinta-feira" | `TRANSCRICAO.md` | Autor: Juliano. Data: 2026-10-31, a de elaboração, com nota de que a data da reunião não foi registrada |
| 17 | `X-Timestamp` serve para detectar replay, mas o HMAC cobre só o corpo, então o timestamp não é assinado | `[09:22] Sofia`, `[09:44] Diego` | Registrar como limitação e item da revisão da Sofia, sem alterar o que foi decidido |

### Assuntos que a reunião não tratou (R2)

| Assunto | Por que importa | Recomendação |
|---|---|---|
| Critério de sucesso da entrega (2xx?) | O worker precisa dele para marcar `entregue` | `⚠️ Inferência` no FDD: indispensável |
| Campo com a data da próxima tentativa | O backoff não funciona sem ele | `⚠️ Inferência` no FDD: indispensável |
| Tabela de histórico de entregas | F8 pede dados por tentativa, e nenhuma tabela foi nomeada | `⚠️ Inferência` no FDD: indispensável |
| Recuperação de linha presa em `processando` após queda do worker | O evento ficaria perdido, contrariando at-least-once | `⚠️ Inferência` no FDD: indispensável |
| Métricas e tracing | O desafio exige, a reunião não trata e o código só tem Pino | `⚠️ Inferência` no FDD: contadores e duração derivados de logs Pino e correlação por `event_id`, sem nova dependência |
| Secret legível para assinar, sem criptografia em repouso definida | O HMAC exige a secret original | Só na lista `⚠️` para revisão da Sofia |
| SSRF por URL cadastrada | Worker chama URLs informadas por usuários | Só na lista `⚠️` para revisão da Sofia |
| Remover ou editar webhook com eventos pendentes | Comportamento não definido | Só na lista `⚠️` do FDD |

## Inferências adotadas

Aceitas pelo autor da documentação em 2026-10-31. **Nenhuma foi decidida na reunião.** Nos documentos, cada uma deve aparecer como `⚠️ Inferência (sem fonte direta)`, com seu ID, e nunca ser atribuída aos participantes. As fontes abaixo são o ponto de apoio, não uma decisão.

| ID | Inferência | Ponto de apoio | Ambiguidade |
|---|---|---|---|
| INF-01 | 1 envio inicial + 5 reenvios (6 chamadas HTTP), nos intervalos 1m/5m/30m/2h/12h | `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa` | 1 |
| INF-02 | O limite de 64KB é checado no worker, antes do envio; acima dele, não envia e move direto para a DLQ com o motivo. A mudança de status não é afetada | `[09:23] Sofia`, `[09:24] Larissa`, `[09:40] Bruno` | 2 |
| INF-03 | Durante as 24h de carência, `X-Signature` leva duas assinaturas, da secret nova e da antiga. Item da revisão da Sofia | `[09:21] Sofia`, `[09:22] Sofia`, `[09:44] Diego` | 3 |
| INF-04 | Uma linha na outbox e um `event_id` por endpoint interessado, cada uma com retry próprio | `[09:25] Diego`, `[09:34] Bruno`, `[09:44] Sofia` | 4 |
| INF-05 | A ordem por `order_id` só vale sem retry: um evento em backoff pode ser ultrapassado pelo seguinte. Não há bloqueio por pedido | `[09:12] Diego`, `[09:13] Larissa` | 6 |
| INF-06 | `pendente` inclui quem aguarda retry; `falhou` marca a linha esgotada, já copiada para `webhook_dead_letter`; o replay a devolve a `pendente` | `[09:08] Diego`, `[09:17] Larissa`, `[09:18] Diego` | 8 |
| INF-07 | `customerId` no body em `POST /webhooks`; no path em `GET /customers/:customerId/webhooks` | `[09:32] Larissa`, `src/modules/orders/order.schemas.ts` | 9 |
| INF-08 | Schema Zod de URL aplicado no service, que lança `WEBHOOK_INVALID_URL`; `validate` e o error middleware não mudam | `[09:23] Sofia`, `[09:28] Bruno`, `src/middlewares/validate.middleware.ts` | 10 |
| INF-09 | `WEBHOOK_SECRET_REQUIRED` fica fora da matriz, porque a secret é sempre gerada pelo sistema | `[09:28] Bruno`, `[09:31] Marcos` | 11 |
| INF-10 | O filtro aceita só `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED` e `CANCELLED`; a criação do pedido não gera evento | `src/modules/orders/order.status.ts`, `[09:40] Bruno` | 13 |
| INF-11 | A outbox não tem FK para `orders`, pois o payload é um snapshot e pedidos `CANCELLED` podem ser excluídos | `src/modules/orders/order.service.ts`, `[09:52] Larissa` | 14 |
| INF-12 | O replay mantém o `event_id` e reinicia as tentativas | `[09:18] Diego`, `[09:25] Diego` | 15 |
| INF-13 | Entrega bem-sucedida é resposta 2xx. Qualquer outro status, erro de rede ou timeout conta como falha | `[09:42] Diego` | Não tratado |
| INF-14 | A outbox tem contador de tentativas e data da próxima tentativa; o worker só lê `pendente` já vencido | `[09:09] Diego`, `[09:17] Larissa` | Não tratado |
| INF-15 | Tabela própria de histórico, com uma linha por tentativa: sucesso/falha, payload, response e tempo de resposta | `[09:34] Marcos` | Não tratado |
| INF-16 | Ao iniciar, o worker devolve a `pendente` as linhas em `processando`. Como há um único worker, elas só podem ser sobras de uma queda. Pode gerar reenvio, o que o at-least-once admite | `[09:12] Diego`, `[09:24] Diego` | Não tratado |
| INF-17 | Métricas derivadas de eventos de log do Pino, sem nova dependência; tracing como correlação por `event_id` e `X-Webhook-Id` | `[09:29] Bruno`, `src/shared/logger/index.ts` | Não tratado |
| INF-18 | Lote de 10 eventos por ciclo, ajustável. A reunião só disse "batch pequeno", então o número é uma proposta | `[09:08] Diego` | Não tratado |
| INF-19 | O processamento fica em `src/modules/webhooks/webhook.worker.ts`, primeira opção citada por Bruno | `[09:28] Bruno` | Q4 |
| INF-20 | O ADR-006 registra como alternativa plausível, não discutida na reunião, uma infraestrutura própria de log e erros, pois nenhuma alternativa ao reuso foi debatida | `[09:29] Bruno` | Não tratado |
| INF-21 | `X-Signature` no formato `sha256=<hex>`, com vírgula na carência; `X-Timestamp` em ISO 8601; HMAC calculado sobre a string exata enviada | `[09:22] Sofia`, `[09:44] Diego` | Não tratado |
| INF-22 | Secret de 32 bytes aleatórios de `node:crypto`, em hexadecimal | `[09:31] Marcos`, `[09:46] Sofia` | Não tratado |
| INF-23 | Rota `POST /webhooks/:id/rotate-secret`, secret anterior com expiração e recusa de nova rotação durante a carência | `[09:21] Sofia` | Não tratado |
| INF-24 | Caminhos de rotas de que a reunião só deu o verbo, nomes de modelos, tabelas, valores de status e arquivos não citados na reunião, e tamanhos de coluna | `[09:08] Diego`, `prisma/schema.prisma` | Não tratado |
| INF-25 | O `id` da outbox é o `event_id`, gerado pela aplicação | `[09:25] Diego`, `[09:51] Larissa` | Não tratado |
| INF-26 | `fetch` nativo, timeout por `AbortSignal` e sem seguir redirecionamentos | `[09:23] Sofia`, `[09:42] Diego`, `package.json` | Não tratado |
| INF-27 | `response` guarda até 65.535 bytes, com truncamento por bytes, pelo limite da coluna `TEXT` | `[09:34] Marcos` | Não tratado |
| INF-28 | Listagens com `paginated()`, `pageSize` padrão 20 e máximo 100 | `[09:34] Marcos`, `src/modules/orders/order.schemas.ts` | Não tratado |
| INF-29 | Replay só com a linha em `FAILED`, por transição condicional, respondendo `202` | `[09:18] Diego` | Não tratado |
| INF-30 | Sete códigos `WEBHOOK_*` não citados na reunião e as mensagens da matriz | `[09:28] Bruno`, `[09:29] Larissa` | Não tratado |
| INF-31 | Só webhooks ativos geram eventos; `PATCH` altera `url`, `statuses` e `active`; `statuses` exige ao menos um item | `[09:21] Bruno`, `[09:33] Bruno` | Não tratado |
| INF-32 | `redactPaths` passa a cobrir `*.secret` e `*.previousSecret` | `[09:29] Bruno`, `src/shared/logger/index.ts` | Não tratado |
| INF-33 | Espera de 2s depois de cada ciclo, um evento por vez, claim por `updateMany` condicional, tentativa de devolver a linha a `PENDING` em erro depois do claim, processo que não encerra por erro de ciclo, conclusão do evento em andamento ao encerrar e valores em constantes | `[09:09] Diego`, `[09:12] Diego`, `src/config/env.ts` | Não tratado |
| INF-34 | `buildWebhookRouter` montado sem prefixo, com `authenticate` por rota | `src/routes/index.ts`, `src/modules/users/user.routes.ts` | Não tratado |
| INF-35 | Outbox, entregas e DLQ sem FK para `webhook_endpoints`; `WebhookEndpoint.customer` sem cascata | `[09:18] Diego`, `prisma/schema.prisma` | Não tratado |
| INF-36 | Implantação na ordem migration, API e worker | `[09:46] Sofia`, `[09:11] Diego` | Não tratado |
| INF-37 | Probabilidades e impactos dos riscos do PRD são avaliação de quem escreve; nenhum valor foi dito na reunião | `src/modules/auth/auth.routes.ts`, `prisma/schema.prisma` | Não tratado |
| INF-38 | Encaminhar à revisão da Sofia os riscos de controle de acesso, a rotação recusada, a secret em repouso, SSRF e o `X-Timestamp` é decisão de quem escreve, não combinada na reunião | `[09:46] Sofia` | Auditoria |
| INF-39 | Rotação de secret e histórico de entregas aceitam qualquer role autenticada, por extensão do CRUD | `[09:36] Marcos`, `[09:37] Sofia`, `[09:48] Larissa` | Auditoria |
| INF-40 | A secret só aparece nas respostas de criação e de rotação | `[09:31] Marcos` | Auditoria |
| INF-41 | A meta "3 de 3" de `PRD-OBJ-02` é derivada do pedido dos três clientes | `[09:00] Marcos` | Auditoria |
| INF-42 | Criptografia da secret em repouso e SSRF foram levantados na elaboração, sem fala nem arquivo que os sustente | Sem apoio | Auditoria |
| INF-43 | "Condições normais" significa sem retry e sem o cenário de `RFC-Q-07` | `[09:02] Marcos` | Revisão crítica |
| INF-44 | `total_cents` é o único campo básico adotado no payload | `[09:43] Diego` | Revisão crítica |
| INF-45 | 64KB significa 65.536 bytes | `[09:24] Diego`, `[09:24] Larissa` | Revisão crítica |

### Tratados como risco ou limitação, não como inferência

| Ambiguidade | Registro nos documentos |
|---|---|
| 5 | Risco com fonte no código: registro público com `role: ADMIN` e falta de vínculo entre `User` e `Customer`. Pré-condição para a revisão da Sofia, sem proposta de mudança de código nesta entrega |
| 7 | Risco e questão em aberto no RFC: worker sequencial com timeout de 10s pode estourar a meta de 10s |
| 17 | Limitação e item da revisão da Sofia: `X-Timestamp` não é assinado |

### Definições editoriais

| Ambiguidade | Definição |
|---|---|
| 12 | Usar `WEBHOOK_NOT_FOUND`, como em `[09:28] Bruno` |
| 16 | Autor: Juliano. Data: 2026-10-31, com nota de que a data da reunião não foi registrada |

### Só na lista de revisão humana

Não viram requisito nem comportamento especificado: criptografia da secret em repouso, SSRF por URL cadastrada e remoção ou edição de webhook com eventos pendentes.

### Continuam em aberto

Q1 (rate limiting), Q2 (endurecer permissões), Q5 (janela de arquivamento) e Q6 (confirmação do prazo com a Atlas). Q3 foi coberta por INF-07 e Q4, por INF-19.
