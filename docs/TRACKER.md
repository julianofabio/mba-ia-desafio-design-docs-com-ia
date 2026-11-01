# Tracker

Rastreabilidade de cada item com ID do pacote até a origem na reunião ou no código. Itens marcados com ⚠️ se apoiam em uma inferência: a localização indica o ponto de apoio, não uma decisão da reunião.

| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |
|----|-----------|------|-------------------|-------|-------------|
| ADR-001 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Registrar eventos de webhook em outbox no MySQL, na mesma transação da mudança de status | TRANSCRICAO | `[09:06] Diego`, `[09:08] Larissa`, `[09:48] Larissa` |
| ADR-001-D-01 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Nenhuma chamada HTTP ao cliente acontece dentro da transação de mudança de status | TRANSCRICAO | `[09:04] Bruno`, `[09:06] Diego` |
| ADR-001-D-02 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | O evento é gravado em uma tabela `webhook_outbox` no MySQL já existente, dentro da mesma transação que atualiza `orders` e `order_status_history` | TRANSCRICAO | `[09:06] Diego`, `[09:08] Larissa`, `[09:48] Larissa` |
| ADR-001-D-03 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Se a inserção na outbox falhar, a mudança de status sofre rollback. Não pode haver status alterado sem evento | TRANSCRICAO | `[09:40] Bruno`, `[09:41] Diego` |
| ADR-001-D-04 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | O service de pedidos grava o evento pela função `publishWebhookEvent(tx, order, fromStatus, toStatus)`, que recebe o client da transação atual | TRANSCRICAO | `[09:41] Bruno`, `[09:41] Diego` |
| ADR-001-ALT-01 | docs/adrs/ADR-001-outbox-no-mysql.md | Alternativa Descartada | Chamada HTTP síncrona dentro da transação | TRANSCRICAO | `[09:04] Bruno`, `[09:06] Diego` |
| ADR-001-ALT-02 | docs/adrs/ADR-001-outbox-no-mysql.md | Alternativa Descartada | Redis Streams ou Redis Cluster | TRANSCRICAO | `[09:07] Larissa`, `[09:07] Diego` |
| ADR-001-ALT-03 | docs/adrs/ADR-001-outbox-no-mysql.md | Alternativa Descartada | Injetar um repository de webhook no `OrderService` | TRANSCRICAO | `[09:41] Bruno`, `[09:41] Diego` |
| ADR-002 | docs/adrs/ADR-002-worker-separado-em-polling.md | Decisão | Processar a outbox com um único worker, em processo separado e polling de 2 segundos | TRANSCRICAO | `[09:10] Larissa`, `[09:11] Diego`, `[09:13] Larissa` |
| ADR-002-D-01 | docs/adrs/ADR-002-worker-separado-em-polling.md | Decisão | O worker faz polling em loop: a cada 2 segundos, busca os eventos pendentes mais antigos em batch pequeno e os processa | TRANSCRICAO | `[09:08] Diego`, `[09:09] Diego`, `[09:10] Larissa` |
| ADR-002-D-02 | docs/adrs/ADR-002-worker-separado-em-polling.md | Decisão | O worker roda em processo separado da API, com o novo entry-point `src/worker.ts` e o novo script `npm run worker` | TRANSCRICAO | `[09:11] Diego`, `[09:11] Larissa`, `[09:28] Bruno` |
| ADR-002-D-03 | docs/adrs/ADR-002-worker-separado-em-polling.md | Decisão | O worker usa o mesmo banco e a mesma `DATABASE_URL`, com sua própria instância de `PrismaClient`, porque é outro processo Node | TRANSCRICAO | `[09:11] Diego`, `[09:30] Bruno` |
| ADR-002-D-04 | docs/adrs/ADR-002-worker-separado-em-polling.md | Decisão | Roda um único worker, que processa por ordem de `created_at` | TRANSCRICAO | `[09:12] Diego`, `[09:13] Larissa` |
| ADR-002-ALT-01 | docs/adrs/ADR-002-worker-separado-em-polling.md | Alternativa Descartada | Trigger no banco para notificar o worker | TRANSCRICAO | `[09:09] Bruno`, `[09:09] Diego` |
| ADR-002-ALT-02 | docs/adrs/ADR-002-worker-separado-em-polling.md | Alternativa Descartada | Worker dentro do processo da API | TRANSCRICAO | `[09:11] Diego` |
| ADR-002-ALT-03 | docs/adrs/ADR-002-worker-separado-em-polling.md | Alternativa Descartada | Compartilhar a instância de `PrismaClient` entre API e worker | TRANSCRICAO | `[09:11] Bruno`, `[09:29] Diego`, `[09:30] Bruno` |
| ADR-002-ALT-04 | docs/adrs/ADR-002-worker-separado-em-polling.md | Questão em Aberto | Múltiplos workers, com partição por `order_id` ou lock pessimista | TRANSCRICAO | `[09:12] Diego`, `[09:13] Bruno`, `[09:13] Diego` |
| ADR-003 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | Retry com backoff exponencial e DLQ em tabela separada | TRANSCRICAO | `[09:17] Larissa`, `[09:18] Diego`, `[09:48] Larissa` |
| ADR-003-D-01 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | O reenvio usa backoff exponencial nos intervalos 1m, 5m, 30m, 2h e 12h | TRANSCRICAO | `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa` |
| ADR-003-D-02 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | O teto é de 5 tentativas. Diego estimou a janela em "quase 15 horas" entre a primeira falha e a última tentativa; a soma dos intervalos dá 14h36 | TRANSCRICAO | `[09:15] Diego`, `[09:16] Larissa`, `[09:17] Larissa` |
| ADR-003-D-03 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | Um cliente que não responde em 10 segundos conta como falha e vai para retry | TRANSCRICAO | `[09:42] Diego` |
| ADR-003-D-04 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | Esgotadas as tentativas, a falha é permanente e o evento vai para a tabela separada `webhook_dead_letter`, com o payload, o motivo da falha e o timestamp | TRANSCRICAO | `[09:15] Diego`, `[09:18] Diego`, `[09:48] Larissa` |
| ADR-003-D-05 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | O reprocessamento é manual, por `POST /admin/webhooks/dead-letter/:id/replay`, que recoloca o evento na outbox como pendente. A autorização desse endpoint está no ADR-008 | TRANSCRICAO | `[09:18] Diego`, `[09:19] Larissa`, `[09:35] Diego` |
| ADR-003-ALT-01 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Alternativa Descartada | Retry indefinido com backoff | TRANSCRICAO | `[09:15] Diego` |
| ADR-003-ALT-02 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Alternativa Descartada | 3 tentativas | TRANSCRICAO | `[09:16] Bruno`, `[09:16] Diego` |
| ADR-003-ALT-03 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Alternativa Descartada | Marcar `failed` na própria outbox, sem tabela separada | TRANSCRICAO | `[09:17] Larissa`, `[09:18] Diego` |
| ADR-004 | docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md | Decisão | Assinar as entregas com HMAC-SHA256 e secret por endpoint, com rotação de 24 horas | TRANSCRICAO | `[09:21] Sofia`, `[09:22] Sofia` |
| ADR-004-D-01 | docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md | Decisão | Toda entrega leva uma assinatura HMAC-SHA256 calculada sobre o corpo do request, no header `X-Signature`, e o cliente a verifica do lado dele | TRANSCRICAO | `[09:20] Sofia`, `[09:22] Sofia` |
| ADR-004-D-02 | docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md | Decisão | Cada endpoint de webhook tem uma secret única, gerada pela plataforma e devolvida na criação | TRANSCRICAO | `[09:21] Sofia`, `[09:31] Marcos` |
| ADR-004-D-03 | docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md | Decisão | A secret é rotacionável pela API. Depois da rotação, a antiga continua válida por 24 horas em paralelo e então deixa de valer | TRANSCRICAO | `[09:21] Sofia`, `[09:22] Sofia` |
| ADR-004-ALT-01 | docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md | Alternativa Descartada | Secret global da plataforma | TRANSCRICAO | `[09:21] Sofia` |
| ADR-005 | docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md | Decisão | Garantir entrega at-least-once, com deduplicação no cliente por X-Event-Id | TRANSCRICAO | `[09:25] Diego`, `[09:26] Larissa` |
| ADR-005-D-01 | docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md | Decisão | A garantia de entrega é at-least-once, e o cliente pode receber o mesmo evento mais de uma vez | TRANSCRICAO | `[09:24] Diego`, `[09:26] Larissa`, `[09:48] Larissa` |
| ADR-005-D-02 | docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md | Decisão | Cada entrega leva o header `X-Event-Id`, com um UUID gerado quando o evento entra na outbox | TRANSCRICAO | `[09:25] Diego` |
| ADR-005-D-03 | docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md | Decisão | A deduplicação é responsabilidade do cliente, pelo `X-Event-Id` | TRANSCRICAO | `[09:25] Diego`, `[09:26] Larissa` |
| ADR-005-D-04 | docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md | Decisão | Esse comportamento será documentado com destaque no portal de desenvolvedor | TRANSCRICAO | `[09:26] Marcos` |
| ADR-005-ALT-01 | docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md | Alternativa Descartada | Exactly-once | TRANSCRICAO | `[09:25] Sofia`, `[09:25] Diego` |
| ADR-006 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Construir webhooks como um módulo comum, reusando os padrões do projeto | TRANSCRICAO | `[09:30] Larissa`, `[09:48] Larissa` |
| ADR-006-D-01 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Reuso máximo do que já existe, com webhook sendo "módulo igual aos outros" | TRANSCRICAO | `[09:30] Larissa`, `[09:48] Larissa` |
| ADR-006-D-02 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Módulos: Molde para o novo `src/modules/webhooks` | TRANSCRICAO | `[09:27] Bruno` |
| ADR-006-D-03 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Composição e rotas: O módulo novo é ligado da mesma forma, sob `/api/v1` | TRANSCRICAO | `[09:27] Bruno` |
| ADR-006-D-04 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Erros: Erros próprios seguem o mesmo modelo | TRANSCRICAO | `[09:28] Bruno`, `[09:30] Larissa` |
| ADR-006-D-05 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Códigos de erro: Prefixo `WEBHOOK_` em todo o módulo | TRANSCRICAO | `[09:28] Bruno`, `[09:29] Larissa` |
| ADR-006-D-06 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Tratamento central de erros: Atende as rotas novas sem alteração | TRANSCRICAO | `[09:29] Bruno` |
| ADR-006-D-07 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Logger: Nenhuma dependência nova de log | TRANSCRICAO | `[09:29] Bruno` |
| ADR-006-D-08 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Validação: Schemas Zod no módulo novo | TRANSCRICAO | `[09:23] Sofia`, `[09:30] Larissa` |
| ADR-006-ALT-01 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Alternativa Descartada | Infraestrutura própria para a feature, com logger e tratamento de erros separados (⚠️ INF-20) | TRANSCRICAO | `[09:29] Bruno` |
| ADR-007 | docs/adrs/ADR-007-evento-materializado-na-insercao.md | Decisão | Resolver filtro de status e payload do evento na inserção da outbox | TRANSCRICAO | `[09:34] Bruno`, `[09:52] Larissa` |
| ADR-007-D-01 | docs/adrs/ADR-007-evento-materializado-na-insercao.md | Decisão | O filtro de status é aplicado na inserção da outbox. Se nenhum webhook do cliente quer aquele status, nenhuma linha é inserida | TRANSCRICAO | `[09:33] Marcos`, `[09:34] Bruno`, `[09:34] Diego` |
| ADR-007-D-02 | docs/adrs/ADR-007-evento-materializado-na-insercao.md | Decisão | O payload é renderizado e guardado na inserção, como snapshot | TRANSCRICAO | `[09:52] Larissa`, `[09:52] Diego`, `[09:52] Bruno` |
| ADR-007-ALT-01 | docs/adrs/ADR-007-evento-materializado-na-insercao.md | Alternativa Descartada | Filtrar na hora do envio | TRANSCRICAO | `[09:34] Diego`, `[09:34] Bruno` |
| ADR-007-ALT-02 | docs/adrs/ADR-007-evento-materializado-na-insercao.md | Alternativa Descartada | Guardar só `order_id` e renderizar no envio | TRANSCRICAO | `[09:51] Bruno`, `[09:52] Larissa` |
| ADR-008 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Decisão | Usar JWT existente, customer_id explícito e role ADMIN apenas no replay | TRANSCRICAO | `[09:32] Larissa`, `[09:36] Larissa`, `[09:37] Sofia` |
| ADR-008-D-01 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Decisão | Os endpoints de webhook usam a autenticação normal por JWT, e o `customer_id` é informado no body ou no path, sem vir do token | TRANSCRICAO | `[09:32] Larissa` |
| ADR-008-D-02 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Decisão | O replay da DLQ exige role `ADMIN`, reusando `requireRole` | TRANSCRICAO | `[09:36] Sofia`, `[09:36] Larissa`, `[09:48] Larissa` |
| ADR-008-D-03 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Decisão | O endpoint de replay registra em log quem o executou, para auditoria | TRANSCRICAO | `[09:36] Sofia` |
| ADR-008-D-04 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Decisão | O restante do CRUD de configuração aceita qualquer role autenticada, "por enquanto" | TRANSCRICAO | `[09:36] Marcos`, `[09:37] Sofia`, `[09:48] Larissa` |
| ADR-008-ALT-01 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Alternativa Descartada | `customer_id` implícito no JWT | TRANSCRICAO | `[09:31] Marcos`, `[09:32] Bruno`, `[09:32] Larissa` |
| ADR-008-ALT-02 | docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md | Questão em Aberto | Permissões mais restritas no CRUD | TRANSCRICAO | `[09:36] Marcos`, `[09:37] Sofia` |
| RFC-COMP-01 | docs/RFC.md | Decisão | Outbox: Registra o evento na transação da mudança de status, já filtrado e com o payload pronto | TRANSCRICAO | `[09:06] Diego`, `[09:34] Bruno`, `[09:52] Larissa` |
| RFC-COMP-02 | docs/RFC.md | Decisão | Worker: Lê a outbox por polling, em processo próprio | TRANSCRICAO | `[09:10] Larissa`, `[09:11] Diego` |
| RFC-COMP-03 | docs/RFC.md | Decisão | Entrega: Envia por HTTPS, reenvia em caso de falha e identifica cada evento para deduplicação | TRANSCRICAO | `[09:23] Sofia`, `[09:15] Diego`, `[09:25] Diego` |
| RFC-COMP-04 | docs/RFC.md | Decisão | Assinatura: Permite ao cliente validar origem e integridade, com secret por endpoint | TRANSCRICAO | `[09:19] Sofia`, `[09:22] Sofia` |
| RFC-COMP-05 | docs/RFC.md | Decisão | DLQ: Guarda os eventos que esgotaram as tentativas, para debug e replay manual | TRANSCRICAO | `[09:18] Diego` |
| RFC-COMP-06 | docs/RFC.md | Decisão | API de gestão: Cadastro de webhooks e rotação de secret, histórico de entregas e replay | TRANSCRICAO | `[09:31] Marcos`, `[09:34] Marcos`, `[09:18] Diego` |
| RFC-GAR-01 | docs/RFC.md | Decisão | Status alterado e evento registrado são atômicos | TRANSCRICAO | `[09:40] Bruno` |
| RFC-GAR-02 | docs/RFC.md | Decisão | Entrega at-least-once | TRANSCRICAO | `[09:24] Diego`, `[09:26] Larissa` |
| RFC-GAR-03 | docs/RFC.md | Decisão | Ordem por `order_id` (⚠️ INF-05) | TRANSCRICAO | `[09:13] Larissa` |
| RFC-GAR-04 | docs/RFC.md | Decisão | Origem e integridade verificáveis | TRANSCRICAO | `[09:19] Sofia`, `[09:22] Sofia` |
| RFC-FORA-01 | docs/RFC.md | Fora de Escopo | Webhooks de entrada | TRANSCRICAO | `[09:02] Marcos`, `[09:03] Sofia` |
| RFC-FORA-02 | docs/RFC.md | Fora de Escopo | Dashboard visual, que é projeto separado do time de frontend | TRANSCRICAO | `[09:39] Marcos`, `[09:40] Larissa` |
| RFC-ALT-01 | docs/RFC.md | Alternativa Descartada | HTTP síncrono na transação: Cliente lento travaria outras mudanças, e cliente fora do ar não pode causar rollback | TRANSCRICAO | `[09:04] Bruno`, `[09:06] Diego` |
| RFC-ALT-02 | docs/RFC.md | Alternativa Descartada | Redis Streams ou Redis Cluster: Mais infraestrutura para um time pequeno: overengineering | TRANSCRICAO | `[09:07] Larissa`, `[09:07] Diego` |
| RFC-ALT-03 | docs/RFC.md | Alternativa Descartada | Trigger no banco para acionar o worker: Mais reativo, mas trigger só executa SQL e avisar o worker exigiria improviso | TRANSCRICAO | `[09:09] Bruno`, `[09:09] Diego` |
| RFC-ALT-04 | docs/RFC.md | Alternativa Descartada | Worker dentro do processo da API: Um reinício da API derrubaria o worker | TRANSCRICAO | `[09:11] Diego` |
| RFC-ALT-05 | docs/RFC.md | Alternativa Descartada | Retry indefinido: Sem limite, o evento fica pendurado para sempre | TRANSCRICAO | `[09:15] Diego` |
| RFC-ALT-06 | docs/RFC.md | Alternativa Descartada | 3 tentativas: Mais agressivo, mas não cobre uma manutenção de 2 horas | TRANSCRICAO | `[09:16] Bruno`, `[09:16] Diego` |
| RFC-ALT-07 | docs/RFC.md | Alternativa Descartada | Marcar `failed` na própria outbox, sem tabela separada: Leitura menos limpa e perda da evidência separada | TRANSCRICAO | `[09:17] Larissa`, `[09:18] Diego` |
| RFC-ALT-08 | docs/RFC.md | Alternativa Descartada | Secret global: "Se vaza uma, vaza tudo" | TRANSCRICAO | `[09:21] Sofia` |
| RFC-ALT-09 | docs/RFC.md | Alternativa Descartada | Exactly-once: Tiraria a deduplicação do cliente, mas exige coordenação dos dois lados | TRANSCRICAO | `[09:25] Sofia`, `[09:25] Diego` |
| RFC-ALT-10 | docs/RFC.md | Alternativa Descartada | Filtrar status na hora do envio: Geraria linhas desnecessárias na outbox | TRANSCRICAO | `[09:34] Diego`, `[09:34] Bruno` |
| RFC-ALT-11 | docs/RFC.md | Alternativa Descartada | Renderizar o payload na hora do envio: O evento deixaria de refletir o momento da mudança | TRANSCRICAO | `[09:51] Bruno`, `[09:52] Larissa` |
| RFC-ALT-12 | docs/RFC.md | Alternativa Descartada | `customer_id` implícito no JWT: O JWT é do usuário operador, não do cliente | TRANSCRICAO | `[09:31] Marcos`, `[09:32] Bruno`, `[09:32] Larissa` |
| RFC-ALT-13 | docs/RFC.md | Alternativa Descartada | Truncar payload acima do limite: Tamanho excessivo indica erro, então é melhor falhar | TRANSCRICAO | `[09:23] Sofia`, `[09:24] Larissa` |
| RFC-Q-01 | docs/RFC.md | Questão em Aberto | Rate limiting de saída | TRANSCRICAO | `[09:39] Larissa`, `[09:38] Diego`, `[09:39] Diego` |
| RFC-Q-02 | docs/RFC.md | Questão em Aberto | Endurecer as permissões do CRUD | TRANSCRICAO | `[09:37] Sofia`, `[09:36] Marcos` |
| RFC-Q-03 | docs/RFC.md | Questão em Aberto | Aviso por e-mail quando o webhook falha | TRANSCRICAO | `[09:37] Larissa`, `[09:37] Marcos` |
| RFC-Q-04 | docs/RFC.md | Questão em Aberto | Múltiplos workers | TRANSCRICAO | `[09:13] Diego`, `[09:13] Bruno` |
| RFC-Q-05 | docs/RFC.md | Questão em Aberto | Arquivamento das linhas entregues | TRANSCRICAO | `[09:08] Diego` |
| RFC-Q-06 | docs/RFC.md | Questão em Aberto | Prazo com a Atlas | TRANSCRICAO | `[09:47] Marcos`, `[09:45] Marcos` |
| RFC-Q-07 | docs/RFC.md | Questão em Aberto | Worker único e sequencial com timeout de 10s contra a meta de 10s | TRANSCRICAO | `[09:42] Diego`, `[09:02] Marcos` |
| RFC-Q-08 | docs/RFC.md | Questão em Aberto | Destino da linha da DLQ depois do replay | TRANSCRICAO | `[09:18] Diego` |
| RFC-Q-09 | docs/RFC.md | Questão em Aberto | Eventos pendentes quando o webhook é editado ou removido | TRANSCRICAO | `[09:33] Bruno` |
| RFC-Q-12 | docs/RFC.md | Questão em Aberto | `X-Timestamp` fora da assinatura (ADR-004) (⚠️ INF-38) | TRANSCRICAO | `[09:22] Sofia`, `[09:44] Diego` |
| RFC-IMP-01 | docs/RFC.md | Integração | Pedidos: `OrderService.changeStatus` passa a gravar o evento na transação, e uma falha nessa gravação faz rollback | TRANSCRICAO | `[09:40] Bruno` |
| RFC-IMP-02 | docs/RFC.md | Integração | Dados: Novos modelos no schema e no mesmo banco | TRANSCRICAO | `[09:07] Diego` |
| RFC-IMP-03 | docs/RFC.md | Integração | Aplicação: Novo módulo ligado à composição e às rotas existentes | TRANSCRICAO | `[09:27] Bruno` |
| RFC-IMP-04 | docs/RFC.md | Integração | Testes e seed: Tabelas novas entram na limpeza; ver FDD-INT-09 e FDD-INT-10 | CODIGO | `tests/setup.ts`, `prisma/seed.ts` |
| RFC-OP-01 | docs/RFC.md | Restrição | Segundo processo para implantar e operar, com novo entry-point ao lado de `src/server.ts` | TRANSCRICAO | `[09:11] Larissa` |
| RFC-OP-02 | docs/RFC.md | Restrição | Reprocessamento da DLQ é manual, feito por `ADMIN` | TRANSCRICAO | `[09:18] Diego`, `[09:36] Larissa` |
| RFC-OP-03 | docs/RFC.md | Restrição | Marcos documenta a integração e o at-least-once no portal de desenvolvedor | TRANSCRICAO | `[09:26] Marcos`, `[09:40] Marcos` |
| RFC-RISCO-01 | docs/RFC.md | Risco | Um cliente sem resposta atrasa os demais além da meta de 10s | TRANSCRICAO | `[09:02] Marcos`, `[09:12] Diego`, `[09:42] Diego` |
| RFC-RISCO-02 | docs/RFC.md | Risco | A exigência de `ADMIN` pode ser contornada: o registro é público e aceita essa role (leitura do código, não reproduzida) (⚠️ INF-38) | CODIGO | `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.schemas.ts` |
| RFC-RISCO-03 | docs/RFC.md | Risco | Sem isolamento entre clientes: `User` não tem vínculo com `Customer` (⚠️ INF-38) | CODIGO | `prisma/schema.prisma` |
| RFC-RISCO-04 | docs/RFC.md | Risco | Requisições simultâneas em `changeStatus`, que não tem lock, poderiam gerar eventos com IDs distintos, que a deduplicação não pega (leitura do código, não reproduzida) | CODIGO | `src/modules/orders/order.service.ts` |
| RFC-RISCO-05 | docs/RFC.md | Risco | Outbox cresce sem arquivamento nesta entrega | TRANSCRICAO | `[09:07] Bruno`, `[09:08] Diego` |
| RFC-RISCO-06 | docs/RFC.md | Risco | A estimativa de 3 sprints pode não caber no fim de novembro: a duração da sprint não foi citada | TRANSCRICAO | `[09:47] Larissa`, `[09:45] Marcos` |
| FDD-OBJ-01 | docs/FDD.md | Métrica | Notificar o cliente em condições normais: Menos de 10s (⚠️ INF-43) | TRANSCRICAO | `[09:02] Marcos` |
| FDD-OBJ-02 | docs/FDD.md | Métrica | Intervalo de polling do worker: 2s | TRANSCRICAO | `[09:10] Larissa` |
| FDD-OBJ-03 | docs/FDD.md | Métrica | Timeout de cada chamada HTTP: 10s | TRANSCRICAO | `[09:42] Diego` |
| FDD-OBJ-04 | docs/FDD.md | Métrica | Teto antes da DLQ: 5 tentativas, em 1m/5m/30m/2h/12h (⚠️ INF-01) | TRANSCRICAO | `[09:17] Larissa` |
| FDD-OBJ-05 | docs/FDD.md | Métrica | Limite do payload: 64KB, sem truncar (⚠️ INF-45) | TRANSCRICAO | `[09:24] Larissa` |
| FDD-OBJ-06 | docs/FDD.md | Métrica | Carência da secret anterior: 24h | TRANSCRICAO | `[09:22] Sofia` |
| FDD-OBJ-07 | docs/FDD.md | Métrica | Status alterado sem evento registrado: Nenhum caso | TRANSCRICAO | `[09:40] Bruno` |
| FDD-FLUXO-01 | docs/FDD.md | Decisão | Criação do evento na outbox (⚠️ INF-04, INF-14, INF-25, INF-31) | TRANSCRICAO | `[09:06] Diego`, `[09:40] Bruno`, `[09:41] Bruno` |
| FDD-FLUXO-02 | docs/FDD.md | Decisão | Processamento pelo worker (⚠️ INF-02, INF-13, INF-14, INF-15, INF-16, INF-18, INF-26, INF-33) | TRANSCRICAO | `[09:09] Diego`, `[09:12] Diego`, `[09:42] Diego` |
| FDD-FLUXO-03 | docs/FDD.md | Decisão | Retry (⚠️ INF-01, INF-05, INF-06, INF-13, INF-14) | TRANSCRICAO | `[09:15] Diego`, `[09:17] Diego`, `[09:17] Larissa` |
| FDD-FLUXO-04 | docs/FDD.md | Decisão | DLQ e replay (⚠️ INF-02, INF-06, INF-12, INF-29) | TRANSCRICAO | `[09:18] Diego`, `[09:36] Sofia`, `[09:36] Larissa` |
| FDD-CONTRATO-01 | docs/FDD.md | Contrato | `POST /webhooks` (⚠️ INF-07, INF-24) | TRANSCRICAO | `[09:31] Marcos`, `[09:37] Sofia` |
| FDD-CONTRATO-02 | docs/FDD.md | Contrato | `GET /customers/:customerId/webhooks` (⚠️ INF-07) | TRANSCRICAO | `[09:33] Bruno` |
| FDD-CONTRATO-03 | docs/FDD.md | Contrato | `PATCH /webhooks/:id` (⚠️ INF-24) | TRANSCRICAO | `[09:33] Bruno` |
| FDD-CONTRATO-04 | docs/FDD.md | Contrato | `DELETE /webhooks/:id` (⚠️ INF-24) | TRANSCRICAO | `[09:33] Bruno` |
| FDD-CONTRATO-05 | docs/FDD.md | Contrato | `POST /webhooks/:id/rotate-secret` (⚠️ INF-23, INF-39) | TRANSCRICAO | `[09:21] Sofia` |
| FDD-CONTRATO-06 | docs/FDD.md | Contrato | `GET /webhooks/:id/deliveries` (⚠️ INF-39) | TRANSCRICAO | `[09:34] Marcos` |
| FDD-CONTRATO-07 | docs/FDD.md | Contrato | `POST /admin/webhooks/dead-letter/:id/replay` | TRANSCRICAO | `[09:18] Diego`, `[09:36] Larissa` |
| FDD-CONTRATO-08 | docs/FDD.md | Contrato | Webhook enviado ao cliente (⚠️ INF-03, INF-13, INF-21) | TRANSCRICAO | `[09:43] Diego`, `[09:44] Diego`, `[09:44] Sofia` |
| FDD-ERR-01 | docs/FDD.md | Erro | `WEBHOOK_NOT_FOUND`: Webhook inexistente | TRANSCRICAO | `[09:28] Bruno` |
| FDD-ERR-02 | docs/FDD.md | Erro | `WEBHOOK_INVALID_URL`: URL malformada ou sem `https` (⚠️ INF-08) | TRANSCRICAO | `[09:23] Sofia` |
| FDD-ERR-03 | docs/FDD.md | Erro | `WEBHOOK_CUSTOMER_NOT_FOUND`: `customerId` inexistente (⚠️ INF-30) | TRANSCRICAO | `[09:29] Larissa` |
| FDD-ERR-04 | docs/FDD.md | Erro | `WEBHOOK_SECRET_ROTATION_IN_PROGRESS`: Rotação durante a carência (⚠️ INF-23, INF-30) | TRANSCRICAO | `[09:21] Sofia`, `[09:29] Larissa` |
| FDD-ERR-05 | docs/FDD.md | Erro | `WEBHOOK_DEAD_LETTER_NOT_FOUND`: Item da DLQ inexistente (⚠️ INF-30) | TRANSCRICAO | `[09:29] Larissa` |
| FDD-ERR-06 | docs/FDD.md | Erro | `WEBHOOK_REPLAY_NOT_ALLOWED`: Linha da outbox fora de `FAILED` (⚠️ INF-29, INF-30) | TRANSCRICAO | `[09:29] Larissa` |
| FDD-ERR-07 | docs/FDD.md | Erro | `WEBHOOK_PAYLOAD_TOO_LARGE`: Worker: corpo acima de 64KB (⚠️ INF-02, INF-30) | TRANSCRICAO | `[09:23] Sofia` |
| FDD-ERR-08 | docs/FDD.md | Erro | `WEBHOOK_DELIVERY_TIMEOUT`: Worker: sem resposta em 10s (⚠️ INF-30) | TRANSCRICAO | `[09:42] Diego` |
| FDD-ERR-09 | docs/FDD.md | Erro | `WEBHOOK_DELIVERY_FAILED`: Worker: status fora de 2xx ou erro de rede (⚠️ INF-13, INF-30) | TRANSCRICAO | `[09:29] Larissa`, `[09:42] Diego` |
| FDD-INT-01 | docs/FDD.md | Integração | `OrderService.changeStatus`: Chama `publishWebhookEvent(tx, order, from, to)` depois de `tx.orderStatusHistory.create`, usando o `tx` existente. `create` e `delete` não… | CODIGO | `src/modules/orders/order.service.ts` |
| FDD-INT-02 | docs/FDD.md | Integração | `Customer` e novos modelos: Recebe a seção 5 | CODIGO | `prisma/schema.prisma` |
| FDD-INT-03 | docs/FDD.md | Integração | `Controllers`, `buildApiRouter`: Acrescenta `webhooks` ao tipo e monta `buildWebhookRouter` sem prefixo (⚠️ INF-34) | CODIGO | `src/routes/index.ts` |
| FDD-INT-04 | docs/FDD.md | Integração | `buildControllers`: Instancia repository, service e controller do módulo, como nos demais | CODIGO | `src/app.ts` |
| FDD-INT-05 | docs/FDD.md | Integração | `AppError`, `BadRequestError`, `ConflictError`: Recebe as três classes novas da seção 7, ao lado de `InsufficientStockError` | CODIGO | `src/shared/errors/http-errors.ts` |
| FDD-INT-06 | docs/FDD.md | Integração | Exports: Exporta as classes novas | CODIGO | `src/shared/errors/index.ts` |
| FDD-INT-07 | docs/FDD.md | Integração | `redactPaths`, `logger`: Mascara os campos de secret. O worker usa `logger.child({ component: 'webhook-worker' })`, porque o campo `service` é fixo em… (⚠️ INF-32) | CODIGO | `src/shared/logger/index.ts` |
| FDD-INT-08 | docs/FDD.md | Integração | Novo script `worker`, no molde de `start`; `tsconfig.build.json` já inclui `src/**/*.ts` | CODIGO | `package.json` |
| FDD-INT-09 | docs/FDD.md | Integração | `beforeEach`: Limpa as quatro tabelas novas antes de `customer` | CODIGO | `tests/setup.ts` |
| FDD-INT-10 | docs/FDD.md | Integração | Lista de `deleteMany`: Mesma limpeza | CODIGO | `prisma/seed.ts` |
| FDD-INT-11 | docs/FDD.md | Integração | Fábricas: Nova fábrica de webhook, que grava direto no banco | CODIGO | `tests/helpers/factories.ts` |
| FDD-INT-12 | docs/FDD.md | Integração | `authenticate`, `requireRole`: Autenticação em todas as rotas e `requireRole('ADMIN')` no replay, como em `src/modules/users/user.routes.ts` | CODIGO | `src/middlewares/auth.middleware.ts`, `src/modules/users/user.routes.ts` |
| FDD-INT-13 | docs/FDD.md | Integração | `validate`: Valida forma de body, query e params; a URL é validada no service (⚠️ INF-08) | CODIGO | `src/middlewares/validate.middleware.ts` |
| FDD-INT-14 | docs/FDD.md | Integração | `errorMiddleware`: Trata os erros das rotas, mas não alcança o worker, que trata os próprios erros | CODIGO | `src/middlewares/error.middleware.ts` |
| FDD-INT-15 | docs/FDD.md | Integração | `prisma`: Importado pelo worker, cria uma instância própria naquele processo | CODIGO | `src/config/database.ts` |
| FDD-INT-16 | docs/FDD.md | Integração | `env`: Nenhuma variável nova: os valores ficam em constantes. O worker também precisa de `JWT_SECRET`, embora não o use, porque `env` valida todas as variáveis ao… (⚠️ INF-33) | CODIGO | `src/config/env.ts` |
| FDD-INT-17 | docs/FDD.md | Integração | `bootstrap`: Estrutura e encerramento de `src/worker.ts` | CODIGO | `src/server.ts` |
| FDD-DEP-01 | docs/FDD.md | Restrição | MySQL e Prisma: Existentes, sem infraestrutura nova | TRANSCRICAO | `[09:07] Diego` |
| FDD-DEP-02 | docs/FDD.md | Restrição | Pino, Zod, `uuid`: Existentes | CODIGO | `package.json` |
| FDD-DEP-03 | docs/FDD.md | Restrição | `fetch` e `node:crypto`: Nativos do Node `>=20`, sem pacote novo (⚠️ INF-22, INF-26) | CODIGO | `package.json` |
| FDD-DEP-04 | docs/FDD.md | Restrição | Revisão de segurança: Bloqueia o deploy; ver RFC, seção 7 | TRANSCRICAO | `[09:46] Sofia`, `[09:49] Sofia` |
| FDD-DEP-05 | docs/FDD.md | Restrição | Portal de desenvolvedor: Ver RFC-OP-03 | TRANSCRICAO | `[09:26] Marcos`, `[09:40] Marcos` |
| FDD-DEP-06 | docs/FDD.md | Restrição | Execução do worker em produção: `docker-compose.yml` só sobe o MySQL, e o repositório não define como manter o processo ativo | CODIGO | `docker-compose.yml` |
| FDD-CA-01 | docs/FDD.md | Requisito Funcional | Dado Webhook ativo do cliente com `SHIPPED` no filtro, então Há uma linha `PENDING` com o snapshot, na mesma transação | TRANSCRICAO | `[09:33] Marcos`, `[09:40] Bruno`, `[09:52] Larissa` |
| FDD-CA-02 | docs/FDD.md | Requisito Funcional | Dado Nenhum webhook com `DELIVERED` no filtro, então Nenhuma linha é inserida e a mudança é concluída | TRANSCRICAO | `[09:34] Bruno` |
| FDD-CA-03 | docs/FDD.md | Requisito Funcional | Dado Falha forçada na inserção da outbox, então Status, histórico e estoque voltam ao estado anterior | TRANSCRICAO | `[09:40] Bruno` |
| FDD-CA-04 | docs/FDD.md | Requisito Funcional | Dado Evento `PENDING` e endpoint que responde 200, então A linha fica `DELIVERED`, e a entrega fica registrada com duração e resposta (⚠️ INF-13, INF-15) | TRANSCRICAO | `[09:08] Diego`, `[09:34] Marcos` |
| FDD-CA-05 | docs/FDD.md | Requisito Funcional | Dado Evento entregue, então A assinatura confere, e os headers `X-Event-Id`, `X-Webhook-Id` e `X-Timestamp` estão presentes | TRANSCRICAO | `[09:22] Sofia`, `[09:44] Diego`, `[09:44] Sofia` |
| FDD-CA-06 | docs/FDD.md | Requisito Funcional | Dado Endpoint que não responde, então A tentativa é registrada com `WEBHOOK_DELIVERY_TIMEOUT` e a linha volta a `PENDING` com `nextAttemptAt` 1 minuto depois (⚠️ INF-14, INF-30) | TRANSCRICAO | `[09:42] Diego`, `[09:17] Larissa` |
| FDD-CA-07 | docs/FDD.md | Requisito Funcional | Dado Endpoint sempre em falha, então A linha fica `FAILED` e há um item em `webhook_dead_letter` com payload, motivo e timestamp (⚠️ INF-01, INF-06) | TRANSCRICAO | `[09:15] Diego`, `[09:18] Diego` |
| FDD-CA-08 | docs/FDD.md | Requisito Funcional | Dado Payload acima de 64KB, então Nenhuma chamada HTTP é feita e o evento vai para a DLQ com `WEBHOOK_PAYLOAD_TOO_LARGE` (⚠️ INF-02, INF-30) | TRANSCRICAO | `[09:23] Sofia`, `[09:24] Larissa` |
| FDD-CA-09 | docs/FDD.md | Requisito Funcional | Dado Item na DLQ e usuário `OPERATOR`, então Resposta 403, e nada muda | TRANSCRICAO | `[09:36] Sofia` |
| FDD-CA-10 | docs/FDD.md | Requisito Funcional | Dado Item na DLQ e usuário `ADMIN`, então Resposta 202, linha em `PENDING` com o mesmo `event_id` e `attempts = 0`, e log com `actorUserId` (⚠️ INF-12, INF-29) | TRANSCRICAO | `[09:18] Diego`, `[09:36] Sofia` |
| FDD-CA-11 | docs/FDD.md | Requisito Funcional | Dado Replay já feito e linha fora de `FAILED`, então Resposta 409 `WEBHOOK_REPLAY_NOT_ALLOWED` (⚠️ INF-29, INF-30) | TRANSCRICAO | `[09:18] Diego` |
| FDD-CA-12 | docs/FDD.md | Requisito Funcional | Dado Requisição com URL `http://`, então Resposta 400 `WEBHOOK_INVALID_URL` | TRANSCRICAO | `[09:23] Sofia` |
| FDD-CA-13 | docs/FDD.md | Requisito Funcional | Dado Webhook criado, então A resposta não contém `secret`, que só foi devolvida na criação (⚠️ INF-40) | TRANSCRICAO | `[09:31] Marcos` |
| FDD-CA-14 | docs/FDD.md | Requisito Funcional | Dado Rotação feita há menos de 24h, então `X-Signature` traz as duas assinaturas; depois de 24h, só a nova (⚠️ INF-03) | TRANSCRICAO | `[09:21] Sofia` |
| FDD-CA-15 | docs/FDD.md | Requisito Funcional | Dado Linha em `PROCESSING` e worker reiniciado, então A linha volta a `PENDING` e é reenviada com o mesmo `X-Event-Id` (⚠️ INF-16) | TRANSCRICAO | `[09:25] Diego` |
| FDD-CA-16 | docs/FDD.md | Requisito Funcional | Dado Erro ao processar um evento depois do claim, então A linha volta a `PENDING`, e o ciclo segue para o próximo evento (⚠️ INF-33) | TRANSCRICAO | `[09:15] Diego` |
| FDD-RISCO-01 | docs/FDD.md | Risco | Efeito de RFC-RISCO-01: cada lote de 10 eventos para endpoints sem resposta bloqueia o worker por até 100s, e lotes seguidos somam esse atraso (⚠️ INF-18) | TRANSCRICAO | `[09:42] Diego` |
| FDD-RISCO-02 | docs/FDD.md | Risco | O corpo vem de `payload Json` (seção 5), e um cliente que reserialize esse JSON antes do HMAC rejeita entregas legítimas | TRANSCRICAO | `[09:22] Sofia` |
| FDD-RISCO-03 | docs/FDD.md | Risco | Secret em texto legível no banco, necessária para assinar (⚠️ INF-42) | TRANSCRICAO | `[09:21] Bruno` |
| FDD-RISCO-04 | docs/FDD.md | Risco | Excluir um cliente com webhook cai em `P2003`, que o `errorMiddleware` não trata, e vira 500 | CODIGO | `src/modules/customers/customer.service.ts`, `src/middlewares/error.middleware.ts` |
| FDD-RISCO-05 | docs/FDD.md | Risco | `webhook_deliveries` guarda o payload a cada tentativa e cresce sem arquivamento (⚠️ INF-15) | TRANSCRICAO | `[09:08] Diego`, `[09:34] Marcos` |
| FDD-RISCO-06 | docs/FDD.md | Risco | Sem processo supervisor definido, o worker pode ficar parado sem aviso (FDD-DEP-06) | CODIGO | `docker-compose.yml` |
| FDD-RISCO-07 | docs/FDD.md | Risco | Bloquear uma nova rotação durante a carência impede trocar uma secret nova que vazou em menos de 24h (⚠️ INF-23, INF-38) | TRANSCRICAO | `[09:21] Sofia` |
| FDD-RISCO-08 | docs/FDD.md | Risco | Se a devolução a `PENDING` falhar, a linha fica em `PROCESSING` até o próximo início do worker, fora de `webhook_outbox_pending` (⚠️ INF-33) | TRANSCRICAO | `[09:15] Diego` |
| FDD-LAC-01 | docs/FDD.md | Questão em Aberto | Destino da linha de `webhook_dead_letter` depois do replay | TRANSCRICAO | `[09:18] Diego` |
| FDD-LAC-02 | docs/FDD.md | Questão em Aberto | Eventos pendentes quando o webhook é removido, desativado ou tem a URL alterada | TRANSCRICAO | `[09:33] Bruno` |
| FDD-LAC-03 | docs/FDD.md | Questão em Aberto | Como o `ADMIN` descobre o `id` do item da DLQ: a reunião definiu o replay, mas nenhuma listagem | TRANSCRICAO | `[09:18] Diego` |
| FDD-LAC-05 | docs/FDD.md | Questão em Aberto | Ferramenta para agregar logs em métricas e alertas: `src/shared/logger/index.ts` só grava logs | CODIGO | `src/shared/logger/index.ts` |
| PRD-PUB-01 | docs/PRD.md | Requisito Funcional | Público: Clientes B2B que integram com o OMS; os solicitantes são Atlas Comercial, MaxDistribuição e Nova Cargo | TRANSCRICAO | `[09:00] Marcos` |
| PRD-PUB-02 | docs/PRD.md | Requisito Funcional | Público: Usuários autenticados que cadastram e gerenciam webhooks direto pela API, sem painel | TRANSCRICAO | `[09:32] Marcos`, `[09:40] Larissa` |
| PRD-PUB-03 | docs/PRD.md | Requisito Funcional | Público: Administradores que reprocessam notificações que falharam definitivamente | TRANSCRICAO | `[09:36] Sofia` |
| PRD-CEN-01 | docs/PRD.md | Requisito Funcional | Cenário: Um cliente só quer saber quando o pedido vira `SHIPPED` ou `DELIVERED`, então cadastra um webhook com esses status e deixa de depender de consultas periódicas | TRANSCRICAO | `[09:33] Marcos` |
| PRD-CEN-02 | docs/PRD.md | Requisito Funcional | Cenário: Um cliente fica fora do ar por duas horas em manutenção planejada e recebe as notificações por reenvio automático quando volta | TRANSCRICAO | `[09:16] Diego` |
| PRD-CEN-03 | docs/PRD.md | Requisito Funcional | Cenário: Uma secret vaza em um log do cliente, que pede outra e tem 24 horas para migrar os sistemas | TRANSCRICAO | `[09:21] Sofia`, `[09:22] Diego` |
| PRD-CEN-04 | docs/PRD.md | Requisito Funcional | Cenário: Um cliente investiga uma falha consultando o histórico de entregas, com resultado, conteúdo, resposta e tempo | TRANSCRICAO | `[09:34] Marcos` |
| PRD-CEN-05 | docs/PRD.md | Requisito Funcional | Cenário: Um cliente fica indisponível por mais tempo que a janela de reenvio, e um administrador reprocessa as notificações manualmente | TRANSCRICAO | `[09:17] Marcos`, `[09:18] Diego` |
| PRD-OBJ-01 | docs/PRD.md | Métrica | Notificar em tempo percebido como real: Menos de 10 segundos (⚠️ INF-43) | TRANSCRICAO | `[09:02] Marcos` |
| PRD-OBJ-02 | docs/PRD.md | Métrica | Atender aos clientes solicitantes: 3 de 3 (⚠️ INF-41) | TRANSCRICAO | `[09:00] Marcos` |
| PRD-OBJ-03 | docs/PRD.md | Métrica | Cobrir indisponibilidades como a manutenção planejada de 2 horas já ocorrida: Quase 15 horas | TRANSCRICAO | `[09:16] Diego`, `[09:17] Diego`, `[09:17] Marcos` |
| PRD-OBJ-04 | docs/PRD.md | Métrica | Entregar no prazo pedido pela Atlas, ainda a confirmar: 3 sprints, com revisão de segurança incluída; a Atlas pede o fim de novembro | TRANSCRICAO | `[09:47] Larissa`, `[09:45] Marcos` |
| PRD-ESC-01 | docs/PRD.md | Requisito Funcional | Escopo: Notificação de mudança de status de pedido para endereços cadastrados pelo cliente | TRANSCRICAO | `[09:00] Marcos` |
| PRD-ESC-02 | docs/PRD.md | Requisito Funcional | Escopo: Gestão de webhooks pela API, incluindo a escolha de status e a troca de secret | TRANSCRICAO | `[09:31] Marcos`, `[09:33] Bruno`, `[09:21] Sofia` |
| PRD-ESC-03 | docs/PRD.md | Requisito Funcional | Escopo: Assinatura das notificações e identificador para deduplicação | TRANSCRICAO | `[09:22] Sofia`, `[09:25] Diego` |
| PRD-ESC-04 | docs/PRD.md | Requisito Funcional | Escopo: Reenvio automático, retenção das falhas definitivas e reprocessamento por administrador | TRANSCRICAO | `[09:15] Diego`, `[09:18] Diego` |
| PRD-ESC-05 | docs/PRD.md | Requisito Funcional | Escopo: Histórico de entregas por webhook | TRANSCRICAO | `[09:34] Marcos` |
| PRD-ESC-06 | docs/PRD.md | Requisito Funcional | Escopo: Documentação da integração no portal de desenvolvedor | TRANSCRICAO | `[09:26] Marcos`, `[09:40] Marcos` |
| PRD-FORA-01 | docs/PRD.md | Fora de Escopo | Webhooks de entrada: Fora de escopo | TRANSCRICAO | `[09:02] Marcos`, `[09:03] Sofia` |
| PRD-FORA-02 | docs/PRD.md | Fora de Escopo | Dashboard visual para o cliente: Fora de escopo; projeto separado do time de frontend | TRANSCRICAO | `[09:39] Marcos`, `[09:40] Larissa` |
| PRD-FORA-03 | docs/PRD.md | Fora de Escopo | E-mail ao cliente quando o webhook falha: Adiado para a próxima fase, depois de medir o impacto | TRANSCRICAO | `[09:37] Marcos`, `[09:37] Larissa` |
| PRD-FORA-04 | docs/PRD.md | Fora de Escopo | Limite de volume de envio por cliente: Em aberto: observar e decidir depois | TRANSCRICAO | `[09:38] Diego`, `[09:39] Larissa` |
| PRD-FORA-05 | docs/PRD.md | Fora de Escopo | Arquivamento de notificações já entregues da fila de envio: Fora do escopo desta feature | TRANSCRICAO | `[09:08] Diego` |
| PRD-FORA-06 | docs/PRD.md | Fora de Escopo | Garantia de entrega única: Descartada: o cliente pode receber a mesma notificação mais de uma vez | TRANSCRICAO | `[09:25] Diego`, `[09:26] Larissa` |
| PRD-FORA-07 | docs/PRD.md | Fora de Escopo | Ordem global entre pedidos: Limitação conhecida: não é oferecida, e os clientes não a pediram | TRANSCRICAO | `[09:13] Larissa`, `[09:14] Marcos` |
| PRD-FR-01 | docs/PRD.md | Requisito Funcional | O cliente é notificado quando o status de um pedido seu muda | TRANSCRICAO | `[09:00] Marcos` |
| PRD-FR-02 | docs/PRD.md | Requisito Funcional | Um usuário autenticado cadastra um webhook informando o cliente, a URL e os status de interesse | TRANSCRICAO | `[09:31] Marcos`, `[09:32] Larissa` |
| PRD-FR-03 | docs/PRD.md | Requisito Funcional | A plataforma gera uma secret única por webhook e a devolve na criação | TRANSCRICAO | `[09:21] Sofia`, `[09:31] Marcos` |
| PRD-FR-04 | docs/PRD.md | Requisito Funcional | O usuário edita um webhook | TRANSCRICAO | `[09:33] Bruno` |
| PRD-FR-05 | docs/PRD.md | Requisito Funcional | O usuário remove um webhook | TRANSCRICAO | `[09:33] Bruno` |
| PRD-FR-06 | docs/PRD.md | Requisito Funcional | O usuário lista os webhooks de um cliente | TRANSCRICAO | `[09:33] Bruno` |
| PRD-FR-07 | docs/PRD.md | Requisito Funcional | Cada webhook recebe apenas os status escolhidos | TRANSCRICAO | `[09:33] Marcos`, `[09:34] Bruno` |
| PRD-FR-08 | docs/PRD.md | Requisito Funcional | O cliente consulta o histórico de entregas de um webhook, com sucesso ou falha, conteúdo, resposta e tempo de resposta | TRANSCRICAO | `[09:34] Marcos` |
| PRD-FR-09 | docs/PRD.md | Requisito Funcional | O cliente pede uma nova secret pela API, e a anterior continua válida por 24 horas | TRANSCRICAO | `[09:21] Sofia` |
| PRD-FR-10 | docs/PRD.md | Requisito Funcional | A plataforma recusa URLs que não usem HTTPS, com erro de validação | TRANSCRICAO | `[09:23] Sofia` |
| PRD-FR-11 | docs/PRD.md | Requisito Funcional | A notificação é reenviada automaticamente em caso de falha, até o limite de tentativas | TRANSCRICAO | `[09:15] Diego`, `[09:17] Larissa` |
| PRD-FR-12 | docs/PRD.md | Requisito Funcional | Uma notificação que esgota as tentativas fica registrada, com o conteúdo, o motivo e o momento da falha | TRANSCRICAO | `[09:18] Diego` |
| PRD-FR-13 | docs/PRD.md | Requisito Funcional | Um administrador reprocessa manualmente uma notificação que falhou definitivamente | TRANSCRICAO | `[09:18] Diego`, `[09:36] Larissa` |
| PRD-FR-14 | docs/PRD.md | Requisito Funcional | Fica registrado quem fez cada reprocessamento | TRANSCRICAO | `[09:36] Sofia` |
| PRD-FR-15 | docs/PRD.md | Requisito Funcional | O cliente consegue verificar que a notificação veio da plataforma e não foi adulterada, pois os dados de pedidos saem para um endpoint fora da infraestrutura da empresa | TRANSCRICAO | `[09:19] Sofia`, `[09:22] Sofia` |
| PRD-FR-16 | docs/PRD.md | Requisito Funcional | Cada notificação traz um identificador que permite ao cliente reconhecer repetições | TRANSCRICAO | `[09:25] Diego` |
| PRD-FR-17 | docs/PRD.md | Requisito Funcional | Cada notificação identifica o webhook cadastrado que a originou | TRANSCRICAO | `[09:44] Sofia` |
| PRD-FR-18 | docs/PRD.md | Requisito Funcional | A notificação informa o pedido, o status anterior e o novo, o cliente e dados básicos como o total, sem os itens | TRANSCRICAO | `[09:43] Diego`, `[09:44] Bruno` |
| PRD-FR-19 | docs/PRD.md | Requisito Funcional | A integração e a possibilidade de repetições são documentadas no portal de desenvolvedor | TRANSCRICAO | `[09:26] Marcos`, `[09:40] Marcos` |
| PRD-NFR-01 | docs/PRD.md | Requisito Não Funcional | Tempo de notificação em condições normais: Menos de 10 segundos (⚠️ INF-43) | TRANSCRICAO | `[09:02] Marcos` |
| PRD-NFR-02 | docs/PRD.md | Requisito Não Funcional | Garantia de entrega: Ao menos uma vez | TRANSCRICAO | `[09:24] Diego`, `[09:26] Larissa` |
| PRD-NFR-03 | docs/PRD.md | Requisito Não Funcional | Consistência: Nenhuma mudança de status sem notificação registrada | TRANSCRICAO | `[09:40] Bruno`, `[09:41] Diego` |
| PRD-NFR-04 | docs/PRD.md | Requisito Não Funcional | Isolamento de falhas: Cliente lento ou fora do ar não trava a mudança de status de outros pedidos nem causa rollback | TRANSCRICAO | `[09:04] Bruno` |
| PRD-NFR-05 | docs/PRD.md | Requisito Não Funcional | Limite de reenvio: 5 tentativas, em 1m, 5m, 30m, 2h e 12h (⚠️ INF-01) | TRANSCRICAO | `[09:17] Larissa` |
| PRD-NFR-06 | docs/PRD.md | Requisito Não Funcional | Tempo de resposta exigido do cliente: Até 10 segundos; acima disso, conta como falha | TRANSCRICAO | `[09:42] Diego` |
| PRD-NFR-07 | docs/PRD.md | Requisito Não Funcional | Tamanho máximo da notificação: 64KB; acima disso é erro, sem truncar | TRANSCRICAO | `[09:23] Sofia`, `[09:24] Larissa` |
| PRD-NFR-08 | docs/PRD.md | Requisito Não Funcional | Transporte: Somente HTTPS | TRANSCRICAO | `[09:23] Sofia` |
| PRD-NFR-09 | docs/PRD.md | Requisito Não Funcional | Ordem das notificações: Por pedido, enquanto houver um único worker, sem ordem global (⚠️ INF-05) | TRANSCRICAO | `[09:13] Larissa` |
| PRD-NFR-10 | docs/PRD.md | Requisito Não Funcional | Controle de acesso: Reprocessamento só por `ADMIN`; demais operações do CRUD por qualquer usuário autenticado, por enquanto; histórico e troca de secret seguem a mesma… (⚠️ INF-39) | TRANSCRICAO | `[09:36] Larissa`, `[09:37] Sofia` |
| PRD-NFR-11 | docs/PRD.md | Requisito Não Funcional | Infraestrutura: Nada além do que já existe | TRANSCRICAO | `[09:07] Diego`, `[09:30] Larissa` |
| PRD-DEC-01 | docs/PRD.md | Trade-off | Status e notificação são registrados juntos, com mais uma escrita na transação de pedido, histórico e estoque, já descrita como pesada | TRANSCRICAO | `[09:06] Diego`, `[09:40] Bruno` |
| PRD-DEC-02 | docs/PRD.md | Trade-off | Envio em processo separado com verificação a cada 2 segundos, sem infraestrutura nova, mas com um processo a mais para operar | TRANSCRICAO | `[09:10] Larissa`, `[09:11] Diego` |
| PRD-DEC-03 | docs/PRD.md | Trade-off | Reenvio por quase 15 horas e depois reprocessamento manual, com o custo de atrasos longos | TRANSCRICAO | `[09:17] Diego`, `[09:18] Diego` |
| PRD-DEC-04 | docs/PRD.md | Trade-off | Assinatura com secret por webhook e troca com carência, com verificação a cargo do cliente | TRANSCRICAO | `[09:22] Sofia` |
| PRD-DEC-05 | docs/PRD.md | Trade-off | Entrega ao menos uma vez, com deduplicação a cargo do cliente | TRANSCRICAO | `[09:25] Diego`, `[09:26] Larissa` |
| PRD-DEC-06 | docs/PRD.md | Trade-off | Módulo igual aos demais, aceitando os limites dos padrões atuais, detalhados no ADR | TRANSCRICAO | `[09:30] Larissa` |
| PRD-DEC-07 | docs/PRD.md | Trade-off | O evento guarda o estado do momento da mudança, e o filtro de status vale só para mudanças futuras | TRANSCRICAO | `[09:34] Bruno`, `[09:52] Larissa` |
| PRD-DEC-08 | docs/PRD.md | Trade-off | Autenticação existente e cliente informado na requisição, com controle de acesso amplo por enquanto | TRANSCRICAO | `[09:32] Larissa`, `[09:37] Sofia` |
| PRD-DEP-01 | docs/PRD.md | Restrição | Revisão de segurança de ao menos 2 dias úteis antes do deploy | TRANSCRICAO | `[09:46] Sofia`, `[09:49] Sofia` |
| PRD-DEP-02 | docs/PRD.md | Restrição | Confirmação do prazo com a Atlas e atualização dos clientes | TRANSCRICAO | `[09:47] Marcos`, `[09:49] Marcos` |
| PRD-DEP-03 | docs/PRD.md | Restrição | Documentação no portal de desenvolvedor | TRANSCRICAO | `[09:26] Marcos`, `[09:40] Marcos` |
| PRD-DEP-04 | docs/PRD.md | Restrição | Sessão de revisão do design antes de começar a codar | TRANSCRICAO | `[09:50] Larissa` |
| PRD-DEP-05 | docs/PRD.md | Restrição | Deduplicação e verificação de assinatura implementadas por cada cliente | TRANSCRICAO | `[09:20] Sofia`, `[09:25] Diego` |
| PRD-DEP-06 | docs/PRD.md | Restrição | Decisões técnicas pendentes (RFC-Q-08, RFC-Q-09, FDD-LAC-03 e FDD-LAC-05) | TRANSCRICAO | `[09:18] Diego`, `[09:33] Bruno` |
| PRD-RISCO-01 | docs/PRD.md | Risco | A Atlas migra para um concorrente se o prazo não for cumprido; a duração da sprint não foi citada, então não se sabe se 3 sprints cabem até o fim de novembro (⚠️ INF-37) | TRANSCRICAO | `[09:00] Marcos`, `[09:47] Marcos` |
| PRD-RISCO-02 | docs/PRD.md | Risco | Sem isolamento entre clientes: um usuário poderia ver ou alterar webhooks de outro cliente (RFC-RISCO-03) (⚠️ INF-37, INF-38) | CODIGO | `prisma/schema.prisma` |
| PRD-RISCO-03 | docs/PRD.md | Risco | A restrição do reprocessamento a `ADMIN` pode ser contornada pelo registro público (RFC-RISCO-02) (⚠️ INF-37, INF-38) | CODIGO | `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.schemas.ts` |
| PRD-RISCO-04 | docs/PRD.md | Risco | Cliente que não deduplica processa a mesma notificação mais de uma vez, por exemplo em um reenvio depois de um timeout de 10 segundos (⚠️ INF-37) | TRANSCRICAO | `[09:25] Sofia`, `[09:42] Diego`, `[09:26] Marcos` |
| PRD-RISCO-05 | docs/PRD.md | Risco | Um cliente sem resposta atrasa as notificações dos demais além dos 10 segundos (RFC-RISCO-01) (⚠️ INF-37) | TRANSCRICAO | `[09:02] Marcos`, `[09:42] Diego` |
| PRD-RISCO-06 | docs/PRD.md | Risco | Um cliente com muitas mudanças recebe um grande volume de chamadas (⚠️ INF-37) | TRANSCRICAO | `[09:38] Diego`, `[09:39] Diego` |
| PRD-RISCO-07 | docs/PRD.md | Risco | Cliente fora do ar por mais que a janela de reenvio não recebe a notificação e não é avisado, pois o e-mail foi adiado (⚠️ INF-37) | TRANSCRICAO | `[09:18] Diego`, `[09:17] Marcos` |
| PRD-CA-01 | docs/PRD.md | Requisito Funcional | Um cliente cadastra um webhook e recebe, em menos de 10 segundos em condições normais, a notificação de um status escolhido (⚠️ INF-43) | TRANSCRICAO | `[09:02] Marcos`, `[09:31] Marcos` |
| PRD-CA-02 | docs/PRD.md | Requisito Funcional | Um status não escolhido não gera notificação | TRANSCRICAO | `[09:34] Bruno` |
| PRD-CA-03 | docs/PRD.md | Requisito Funcional | O cliente verifica a assinatura e reconhece repetições pelo identificador | TRANSCRICAO | `[09:22] Sofia`, `[09:25] Diego` |
| PRD-CA-04 | docs/PRD.md | Requisito Funcional | Um cadastro com URL que não usa HTTPS é recusado | TRANSCRICAO | `[09:23] Sofia` |
| PRD-CA-05 | docs/PRD.md | Requisito Funcional | Um cliente fora do ar por duas horas recebe a notificação por reenvio automático quando volta (⚠️ INF-01) | TRANSCRICAO | `[09:16] Diego`, `[09:17] Larissa` |
| PRD-CA-06 | docs/PRD.md | Requisito Funcional | Uma notificação que esgota as tentativas fica registrada e pode ser reprocessada por um administrador, que fica identificado; outros perfis são recusados | TRANSCRICAO | `[09:18] Diego`, `[09:36] Sofia` |
| PRD-CA-07 | docs/PRD.md | Requisito Funcional | Depois de trocar a secret, o cliente tem 24 horas para migrar sem perder a validação | TRANSCRICAO | `[09:21] Sofia` |
| PRD-CA-08 | docs/PRD.md | Requisito Funcional | O histórico mostra resultado, conteúdo, resposta e tempo de cada entrega | TRANSCRICAO | `[09:34] Marcos` |
| PRD-CA-09 | docs/PRD.md | Requisito Funcional | Um cliente fora do ar não impede nem atrasa a mudança de status | TRANSCRICAO | `[09:04] Bruno` |
| PRD-CA-10 | docs/PRD.md | Requisito Funcional | O portal de desenvolvedor explica a integração e a possibilidade de repetições | TRANSCRICAO | `[09:26] Marcos`, `[09:40] Marcos` |
| PRD-TST-01 | docs/PRD.md | Restrição | Testes automatizados de integração: Critérios técnicos do FDD, com o padrão atual do projeto: Vitest e Supertest contra banco real | CODIGO | `vitest.config.ts`, `tests/setup.ts` |
| PRD-TST-02 | docs/PRD.md | Restrição | Testes ponta a ponta: Integração com a mudança de status de pedidos | TRANSCRICAO | `[09:46] Larissa` |
| PRD-TST-03 | docs/PRD.md | Restrição | Revisão de segurança: Assinatura e geração de secret; os riscos PRD-RISCO-02 e PRD-RISCO-03 entram por encaminhamento (⚠️ INF-38) | TRANSCRICAO | `[09:46] Sofia` |
| PRD-TST-04 | docs/PRD.md | Restrição | Acompanhamento depois da entrega: Tempo de notificação. O volume por cliente (RFC-Q-01) e o impacto citado por Larissa ainda não têm métrica definida (⚠️ INF-17) | TRANSCRICAO | `[09:37] Larissa`, `[09:39] Diego` |

## Cobertura

Contagens obtidas por script sobre `docs/PRD.md`, `docs/RFC.md`, `docs/FDD.md` e `docs/adrs/ADR-*.md`.

- **Itens identificáveis:** 279 IDs distintos nos documentos.
- **Itens com linha na tabela:** 276 de 279 (98.9%). Meta: ≥ 80%.
- **Linhas com Fonte = TRANSCRICAO e timestamp válido:** 246 de 276 (89.1%). Meta: ≥ 70%.
- **Linhas com Fonte = CODIGO e caminho existente:** 30. Meta: ≥ 5.
- **IDs citados sem definição:** nenhum.
- **Linhas com ⚠️:** 64.

**Limites desta contagem:** as seções de trade-off e as consequências dos ADRs não têm ID próprio, então não têm linha; os trade-offs aparecem em `PRD-DEC-01` a `08`. A lista de tipos não tem categoria para público, cenário, escopo e critério de aceite, que entram como Requisito Funcional. Fluxos e componentes entram como Decisão; dependências e etapas de validação, como Restrição. Duas alternativas adiadas nos ADRs, `ADR-002-ALT-04` e `ADR-008-ALT-02`, entram como Questão em Aberto. A contagem cobre só itens com ID: as regras de campo do FDD (seção 5), as linhas de resiliência (seção 8), as métricas e os logs (seção 9) e a tabela de arquivos novos não têm ID nem linha.

**Lacunas identificadas na elaboração:** `RFC-Q-07` a `RFC-Q-09`, `RFC-Q-12`, `FDD-LAC-01` a `FDD-LAC-03`, `RFC-RISCO-01`, `PRD-RISCO-05` e `FDD-RISCO-02` não foram discutidos na reunião. A localização delas aponta para a fala que definiu o comportamento relacionado, por exemplo o replay em `[09:18] Diego`, e não para uma discussão da lacuna. O mesmo vale para `PRD-DEP-06`, que agrupa as lacunas.

### Itens sem fonte

Só contém itens marcados com ⚠️: surgiram na elaboração, sem fala nem arquivo que os sustente diretamente.

- **RFC-Q-10** (docs/RFC.md): Criptografia da secret em repouso. ⚠️ Criptografia em repouso não foi citada na reunião; levantada na elaboração.
- **RFC-Q-11** (docs/RFC.md): SSRF por URL cadastrada. ⚠️ SSRF não foi citado na reunião nem há tratamento no código; levantado na elaboração para a revisão da Sofia.
- **FDD-LAC-04** (docs/FDD.md): Criptografia da secret em repouso e SSRF por URL cadastrada. ⚠️ Criptografia em repouso e SSRF não foram citados na reunião; levantados na elaboração para a revisão da Sofia.

### Inferências (sem fonte direta)

Nenhuma foi decidida na reunião.

- **INF-01** (aceita em 2026-10-31): 1 envio inicial + 5 reenvios (6 chamadas HTTP), nos intervalos 1m/5m/30m/2h/12h. Apoio: `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa`. Em: docs/adrs/ADR-003-retry-com-backoff-e-dlq.md, docs/FDD.md, docs/PRD.md.
- **INF-02** (aceita em 2026-10-31): O limite de 64KB é checado no worker, antes do envio; acima dele, não envia e move direto para a DLQ com o motivo. A mudança de status não é afetada. Apoio: `[09:23] Sofia`, `[09:24] Larissa`, `[09:40] Bruno`. Em: docs/adrs/ADR-003-retry-com-backoff-e-dlq.md, docs/FDD.md.
- **INF-03** (aceita em 2026-10-31): Durante as 24h de carência, `X-Signature` leva duas assinaturas, da secret nova e da antiga. Item da revisão da Sofia. Apoio: `[09:21] Sofia`, `[09:22] Sofia`, `[09:44] Diego`. Em: docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md, docs/FDD.md.
- **INF-04** (aceita em 2026-10-31): Uma linha na outbox e um `event_id` por endpoint interessado, cada uma com retry próprio. Apoio: `[09:25] Diego`, `[09:34] Bruno`, `[09:44] Sofia`. Em: docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md, docs/adrs/ADR-007-evento-materializado-na-insercao.md, docs/FDD.md.
- **INF-05** (aceita em 2026-10-31): A ordem por `order_id` só vale sem retry: um evento em backoff pode ser ultrapassado pelo seguinte. Não há bloqueio por pedido. Apoio: `[09:12] Diego`, `[09:13] Larissa`. Em: docs/adrs/ADR-002-worker-separado-em-polling.md, docs/RFC.md, docs/FDD.md, docs/PRD.md.
- **INF-06** (aceita em 2026-10-31): `pendente` inclui quem aguarda retry; `falhou` marca a linha esgotada, já copiada para `webhook_dead_letter`; o replay a devolve a `pendente`. Apoio: `[09:08] Diego`, `[09:17] Larissa`, `[09:18] Diego`. Em: docs/adrs/ADR-003-retry-com-backoff-e-dlq.md, docs/FDD.md.
- **INF-07** (aceita em 2026-10-31): `customerId` no body em `POST /webhooks`; no path em `GET /customers/:customerId/webhooks`. Apoio: `[09:32] Larissa`, `src/modules/orders/order.schemas.ts`. Em: docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md, docs/FDD.md.
- **INF-08** (aceita em 2026-10-31): Schema Zod de URL aplicado no service, que lança `WEBHOOK_INVALID_URL`; `validate` e o error middleware não mudam. Apoio: `[09:23] Sofia`, `[09:28] Bruno`, `src/middlewares/validate.middleware.ts`. Em: docs/adrs/ADR-006-reuso-dos-padroes-existentes.md, docs/FDD.md.
- **INF-09** (aceita em 2026-10-31): `WEBHOOK_SECRET_REQUIRED` fica fora da matriz, porque a secret é sempre gerada pelo sistema. Apoio: `[09:28] Bruno`, `[09:31] Marcos`. Em: docs/adrs/ADR-006-reuso-dos-padroes-existentes.md, docs/FDD.md.
- **INF-10** (aceita em 2026-10-31): O filtro aceita só `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED` e `CANCELLED`; a criação do pedido não gera evento. Apoio: `src/modules/orders/order.status.ts`, `[09:40] Bruno`. Em: docs/adrs/ADR-007-evento-materializado-na-insercao.md, docs/FDD.md, docs/PRD.md.
- **INF-11** (aceita em 2026-10-31): A outbox não tem FK para `orders`, pois o payload é um snapshot e pedidos `CANCELLED` podem ser excluídos. Apoio: `src/modules/orders/order.service.ts`, `[09:52] Larissa`. Em: docs/adrs/ADR-007-evento-materializado-na-insercao.md, docs/FDD.md.
- **INF-12** (aceita em 2026-10-31): O replay mantém o `event_id` e reinicia as tentativas. Apoio: `[09:18] Diego`, `[09:25] Diego`. Em: docs/adrs/ADR-003-retry-com-backoff-e-dlq.md, docs/adrs/ADR-005-entrega-at-least-once-com-event-id.md, docs/FDD.md.
- **INF-13** (aceita em 2026-10-31): Entrega bem-sucedida é resposta 2xx. Qualquer outro status, erro de rede ou timeout conta como falha. Apoio: `[09:42] Diego`. Em: docs/adrs/ADR-003-retry-com-backoff-e-dlq.md, docs/FDD.md.
- **INF-14** (aceita em 2026-10-31): A outbox tem contador de tentativas e data da próxima tentativa; o worker só lê `pendente` já vencido. Apoio: `[09:09] Diego`, `[09:17] Larissa`. Em: docs/adrs/ADR-003-retry-com-backoff-e-dlq.md, docs/FDD.md.
- **INF-15** (aceita em 2026-10-31): Tabela própria de histórico, com uma linha por tentativa: sucesso/falha, payload, response e tempo de resposta. Apoio: `[09:34] Marcos`. Em: docs/FDD.md.
- **INF-16** (aceita em 2026-10-31): Ao iniciar, o worker devolve a `pendente` as linhas em `processando`. Como há um único worker, elas só podem ser sobras de uma queda. Pode gerar reenvio, o que o at-least-once admite. Apoio: `[09:12] Diego`, `[09:24] Diego`. Em: docs/adrs/ADR-002-worker-separado-em-polling.md, docs/FDD.md.
- **INF-17** (aceita em 2026-10-31): Métricas derivadas de eventos de log do Pino, sem nova dependência; tracing como correlação por `event_id` e `X-Webhook-Id`. Apoio: `[09:29] Bruno`, `src/shared/logger/index.ts`. Em: docs/FDD.md, docs/PRD.md.
- **INF-18** (aceita em 2026-10-31): Lote de 10 eventos por ciclo, ajustável. A reunião só disse "batch pequeno", então o número é uma proposta. Apoio: `[09:08] Diego`. Em: docs/FDD.md.
- **INF-19** (aceita em 2026-10-31): O processamento fica em `src/modules/webhooks/webhook.worker.ts`, primeira opção citada por Bruno. Apoio: `[09:28] Bruno`. Em: docs/adrs/ADR-002-worker-separado-em-polling.md, docs/FDD.md.
- **INF-20** (aceita em 2026-10-31): O ADR-006 registra como alternativa plausível, não discutida na reunião, uma infraestrutura própria de log e erros, pois nenhuma alternativa ao reuso foi debatida. Apoio: `[09:29] Bruno`. Em: docs/adrs/ADR-006-reuso-dos-padroes-existentes.md.
- **INF-21** (aceita em 2026-10-31): `X-Signature` no formato `sha256=<hex>`, com vírgula na carência; `X-Timestamp` em ISO 8601; HMAC calculado sobre a string exata enviada. Apoio: `[09:22] Sofia`, `[09:44] Diego`. Em: docs/FDD.md.
- **INF-22** (aceita em 2026-10-31): Secret de 32 bytes aleatórios de `node:crypto`, em hexadecimal. Apoio: `[09:31] Marcos`, `[09:46] Sofia`. Em: docs/FDD.md.
- **INF-23** (aceita em 2026-10-31): Rota `POST /webhooks/:id/rotate-secret`, secret anterior com expiração e recusa de nova rotação durante a carência. Apoio: `[09:21] Sofia`. Em: docs/FDD.md.
- **INF-24** (aceita em 2026-10-31): Caminhos de rotas de que a reunião só deu o verbo, nomes de modelos, tabelas, valores de status e arquivos não citados na reunião, e tamanhos de coluna. Apoio: `[09:08] Diego`, `prisma/schema.prisma`. Em: docs/FDD.md.
- **INF-25** (aceita em 2026-10-31): O `id` da outbox é o `event_id`, gerado pela aplicação. Apoio: `[09:25] Diego`, `[09:51] Larissa`. Em: docs/FDD.md.
- **INF-26** (aceita em 2026-10-31): `fetch` nativo, timeout por `AbortSignal` e sem seguir redirecionamentos. Apoio: `[09:23] Sofia`, `[09:42] Diego`, `package.json`. Em: docs/FDD.md.
- **INF-27** (aceita em 2026-10-31): `response` guarda até 65.535 bytes, com truncamento por bytes, pelo limite da coluna `TEXT`. Apoio: `[09:34] Marcos`. Em: docs/FDD.md.
- **INF-28** (aceita em 2026-10-31): Listagens com `paginated()`, `pageSize` padrão 20 e máximo 100. Apoio: `[09:34] Marcos`, `src/modules/orders/order.schemas.ts`. Em: docs/FDD.md.
- **INF-29** (aceita em 2026-10-31): Replay só com a linha em `FAILED`, por transição condicional, respondendo `202`. Apoio: `[09:18] Diego`. Em: docs/FDD.md.
- **INF-30** (aceita em 2026-10-31): Sete códigos `WEBHOOK_*` não citados na reunião e as mensagens da matriz. Apoio: `[09:28] Bruno`, `[09:29] Larissa`. Em: docs/FDD.md.
- **INF-31** (aceita em 2026-10-31): Só webhooks ativos geram eventos; `PATCH` altera `url`, `statuses` e `active`; `statuses` exige ao menos um item. Apoio: `[09:21] Bruno`, `[09:33] Bruno`. Em: docs/FDD.md.
- **INF-32** (aceita em 2026-10-31): `redactPaths` passa a cobrir `*.secret` e `*.previousSecret`. Apoio: `[09:29] Bruno`, `src/shared/logger/index.ts`. Em: docs/FDD.md.
- **INF-33** (aceita em 2026-10-31): Espera de 2s depois de cada ciclo, um evento por vez, claim por `updateMany` condicional, tentativa de devolver a linha a `PENDING` em erro depois do claim, processo que não encerra por erro de ciclo, conclusão do evento em andamento ao encerrar e valores em constantes. Apoio: `[09:09] Diego`, `[09:12] Diego`, `src/config/env.ts`. Em: docs/FDD.md.
- **INF-34** (aceita em 2026-10-31): `buildWebhookRouter` montado sem prefixo, com `authenticate` por rota. Apoio: `src/routes/index.ts`, `src/modules/users/user.routes.ts`. Em: docs/FDD.md.
- **INF-35** (aceita em 2026-10-31): Outbox, entregas e DLQ sem FK para `webhook_endpoints`; `WebhookEndpoint.customer` sem cascata. Apoio: `[09:18] Diego`, `prisma/schema.prisma`. Em: docs/FDD.md.
- **INF-36** (aceita em 2026-10-31): Implantação na ordem migration, API e worker. Apoio: `[09:46] Sofia`, `[09:11] Diego`. Em: docs/FDD.md.
- **INF-37** (aceita em 2026-10-31): Probabilidades e impactos dos riscos do PRD são avaliação de quem escreve; nenhum valor foi dito na reunião. Apoio: `src/modules/auth/auth.routes.ts`, `prisma/schema.prisma`. Em: docs/PRD.md.
- **INF-38** (aceita em 2026-10-31): Encaminhar à revisão da Sofia os riscos de controle de acesso, a rotação recusada, a secret em repouso, SSRF e o `X-Timestamp` é decisão de quem escreve, não combinada na reunião. Apoio: `[09:46] Sofia`. Em: docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md, docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md, docs/RFC.md, docs/FDD.md, docs/PRD.md.
- **INF-39** (aceita em 2026-10-31): Rotação de secret e histórico de entregas aceitam qualquer role autenticada, por extensão do CRUD. Apoio: `[09:36] Marcos`, `[09:37] Sofia`, `[09:48] Larissa`. Em: docs/FDD.md, docs/PRD.md.
- **INF-40** (aceita em 2026-10-31): A secret só aparece nas respostas de criação e de rotação. Apoio: `[09:31] Marcos`. Em: docs/FDD.md.
- **INF-41** (aceita em 2026-10-31): A meta "3 de 3" de `PRD-OBJ-02` é derivada do pedido dos três clientes. Apoio: `[09:00] Marcos`. Em: docs/PRD.md.
- **INF-42** (aceita em 2026-10-31): Criptografia da secret em repouso e SSRF foram levantados na elaboração, sem fala nem arquivo que os sustente. Apoio: Sem apoio. Em: docs/adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md, docs/adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md, docs/RFC.md, docs/FDD.md.
- **INF-43** (aceita em 2026-10-31): "Condições normais" significa sem retry e sem o cenário de `RFC-Q-07`. Apoio: `[09:02] Marcos`. Em: docs/FDD.md, docs/PRD.md.
- **INF-44** (aceita em 2026-10-31): `total_cents` é o único campo básico adotado no payload. Apoio: `[09:43] Diego`. Em: docs/FDD.md.
- **INF-45** (aceita em 2026-10-31): 64KB significa 65.536 bytes. Apoio: `[09:24] Diego`, `[09:24] Larissa`. Em: docs/FDD.md.
