# PRD: Sistema de Webhooks de Notificação de Pedidos

| Campo | Valor |
|---|---|
| **Autor** | Juliano |
| **Data** | 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00") |
| **Documentos relacionados** | [RFC](./RFC.md), [FDD](./FDD.md), [ADRs](./adrs/) |

## 1. Resumo e contexto da feature

Três clientes B2B pediram para saber automaticamente quando o status dos seus pedidos muda (`[09:00] Marcos`). Esta feature permite que cada cliente cadastre um endereço próprio, escolha os status de interesse e receba uma notificação assinada, com reenvio automático em caso de falha. Ela é apenas de saída: os clientes querem receber, não enviar (`[09:02] Marcos`).

## 2. Problema e motivação

- **Integração lenta e cara:** hoje os clientes consultam `GET /orders` de tempos em tempos para descobrir se algo mudou (`[09:00] Marcos`).
- **Risco comercial:** a Atlas Comercial sugeriu que pode migrar para um concorrente se não houver entrega no prazo (`[09:00] Marcos`).
- **Sem alternativa na plataforma:** o OMS não oferece hoje nenhuma notificação externa ([RFC, seção 3](./RFC.md)).

## 3. Público-alvo e cenários de uso

| ID | Público | Fonte |
|---|---|---|
| PRD-PUB-01 | Clientes B2B que integram com o OMS; os solicitantes são Atlas Comercial, MaxDistribuição e Nova Cargo | `[09:00] Marcos` |
| PRD-PUB-02 | Usuários autenticados que cadastram e gerenciam webhooks direto pela API, sem painel | `[09:32] Marcos`, `[09:40] Larissa` |
| PRD-PUB-03 | Administradores que reprocessam notificações que falharam definitivamente | `[09:36] Sofia` |

| ID | Cenário | Fonte |
|---|---|---|
| PRD-CEN-01 | Um cliente só quer saber quando o pedido vira `SHIPPED` ou `DELIVERED`, então cadastra um webhook com esses status e deixa de depender de consultas periódicas | `[09:33] Marcos` |
| PRD-CEN-02 | Um cliente fica fora do ar por duas horas em manutenção planejada e recebe as notificações por reenvio automático quando volta | `[09:16] Diego` |
| PRD-CEN-03 | Uma secret vaza em um log do cliente, que pede outra e tem 24 horas para migrar os sistemas | `[09:21] Sofia`, `[09:22] Diego` |
| PRD-CEN-04 | Um cliente investiga uma falha consultando o histórico de entregas, com resultado, conteúdo, resposta e tempo | `[09:34] Marcos` |
| PRD-CEN-05 | Um cliente fica indisponível por mais tempo que a janela de reenvio, e um administrador reprocessa as notificações manualmente | `[09:17] Marcos`, `[09:18] Diego` |

## 4. Objetivos e métricas de sucesso

| ID | Objetivo | Métrica | Meta | Fonte |
|---|---|---|---|---|
| PRD-OBJ-01 | Notificar em tempo percebido como real | Tempo entre a mudança de status e a notificação, em condições normais (⚠️ INF-43) | Menos de 10 segundos | `[09:02] Marcos` |
| PRD-OBJ-02 | Atender aos clientes solicitantes | Clientes solicitantes atendidos | 3 de 3 (⚠️ INF-41) | `[09:00] Marcos` |
| PRD-OBJ-03 | Cobrir indisponibilidades como a manutenção planejada de 2 horas já ocorrida | Janela de reenvio automático | Quase 15 horas | `[09:16] Diego`, `[09:17] Diego`, `[09:17] Marcos` |
| PRD-OBJ-04 | Entregar no prazo pedido pela Atlas, ainda a confirmar | Prazo | 3 sprints, com revisão de segurança incluída; a Atlas pede o fim de novembro | `[09:47] Larissa`, `[09:45] Marcos` |

A reunião não citou taxa de sucesso de entrega nem meta de redução de consultas a `GET /orders`, portanto nenhuma foi definida aqui. A forma de medir PRD-OBJ-01 é ⚠️ INF-17 e ainda depende de uma ferramenta de agregação não definida (FDD-LAC-05).

## 5. Escopo

### 5.1 Incluso

| ID | Item |
|---|---|
| PRD-ESC-01 | Notificação de mudança de status de pedido para endereços cadastrados pelo cliente |
| PRD-ESC-02 | Gestão de webhooks pela API, incluindo a escolha de status e a troca de secret |
| PRD-ESC-03 | Assinatura das notificações e identificador para deduplicação |
| PRD-ESC-04 | Reenvio automático, retenção das falhas definitivas e reprocessamento por administrador |
| PRD-ESC-05 | Histórico de entregas por webhook |
| PRD-ESC-06 | Documentação da integração no portal de desenvolvedor |

Os requisitos da seção 6 têm a origem de cada item. A criação do pedido não gera notificação (⚠️ INF-10).

### 5.2 Fora de escopo

| ID | Item | Situação | Fonte |
|---|---|---|---|
| PRD-FORA-01 | Webhooks de entrada | Fora de escopo | `[09:02] Marcos`, `[09:03] Sofia` |
| PRD-FORA-02 | Dashboard visual para o cliente | Fora de escopo; projeto separado do time de frontend | `[09:39] Marcos`, `[09:40] Larissa` |
| PRD-FORA-03 | E-mail ao cliente quando o webhook falha | Adiado para a próxima fase, depois de medir o impacto | `[09:37] Marcos`, `[09:37] Larissa` |
| PRD-FORA-04 | Limite de volume de envio por cliente | Em aberto: observar e decidir depois | `[09:38] Diego`, `[09:39] Larissa` |
| PRD-FORA-05 | Arquivamento de notificações já entregues da fila de envio | Fora do escopo desta feature | `[09:08] Diego` |
| PRD-FORA-06 | Garantia de entrega única | Descartada: o cliente pode receber a mesma notificação mais de uma vez | `[09:25] Diego`, `[09:26] Larissa` |
| PRD-FORA-07 | Ordem global entre pedidos | Limitação conhecida: não é oferecida, e os clientes não a pediram | `[09:13] Larissa`, `[09:14] Marcos` |

## 6. Requisitos funcionais

| ID | Requisito | Fonte |
|---|---|---|
| PRD-FR-01 | O cliente é notificado quando o status de um pedido seu muda | `[09:00] Marcos` |
| PRD-FR-02 | Um usuário autenticado cadastra um webhook informando o cliente, a URL e os status de interesse | `[09:31] Marcos`, `[09:32] Larissa` |
| PRD-FR-03 | A plataforma gera uma secret única por webhook e a devolve na criação | `[09:21] Sofia`, `[09:31] Marcos` |
| PRD-FR-04 | O usuário edita um webhook | `[09:33] Bruno` |
| PRD-FR-05 | O usuário remove um webhook | `[09:33] Bruno` |
| PRD-FR-06 | O usuário lista os webhooks de um cliente | `[09:33] Bruno` |
| PRD-FR-07 | Cada webhook recebe apenas os status escolhidos | `[09:33] Marcos`, `[09:34] Bruno` |
| PRD-FR-08 | O cliente consulta o histórico de entregas de um webhook, com sucesso ou falha, conteúdo, resposta e tempo de resposta | `[09:34] Marcos` |
| PRD-FR-09 | O cliente pede uma nova secret pela API, e a anterior continua válida por 24 horas | `[09:21] Sofia` |
| PRD-FR-10 | A plataforma recusa URLs que não usem HTTPS, com erro de validação | `[09:23] Sofia` |
| PRD-FR-11 | A notificação é reenviada automaticamente em caso de falha, até o limite de tentativas | `[09:15] Diego`, `[09:17] Larissa` |
| PRD-FR-12 | Uma notificação que esgota as tentativas fica registrada, com o conteúdo, o motivo e o momento da falha | `[09:18] Diego` |
| PRD-FR-13 | Um administrador reprocessa manualmente uma notificação que falhou definitivamente | `[09:18] Diego`, `[09:36] Larissa` |
| PRD-FR-14 | Fica registrado quem fez cada reprocessamento | `[09:36] Sofia` |
| PRD-FR-15 | O cliente consegue verificar que a notificação veio da plataforma e não foi adulterada, pois os dados de pedidos saem para um endpoint fora da infraestrutura da empresa | `[09:19] Sofia`, `[09:22] Sofia` |
| PRD-FR-16 | Cada notificação traz um identificador que permite ao cliente reconhecer repetições | `[09:25] Diego` |
| PRD-FR-17 | Cada notificação identifica o webhook cadastrado que a originou | `[09:44] Sofia` |
| PRD-FR-18 | A notificação informa o pedido, o status anterior e o novo, o cliente e dados básicos como o total, sem os itens | `[09:43] Diego`, `[09:44] Bruno` |
| PRD-FR-19 | A integração e a possibilidade de repetições são documentadas no portal de desenvolvedor | `[09:26] Marcos`, `[09:40] Marcos` |

## 7. Requisitos não funcionais

| ID | Requisito | Valor | Fonte |
|---|---|---|---|
| PRD-NFR-01 | Tempo de notificação em condições normais (⚠️ INF-43) | Menos de 10 segundos | `[09:02] Marcos` |
| PRD-NFR-02 | Garantia de entrega | Ao menos uma vez | `[09:24] Diego`, `[09:26] Larissa` |
| PRD-NFR-03 | Consistência | Nenhuma mudança de status sem notificação registrada | `[09:40] Bruno`, `[09:41] Diego` |
| PRD-NFR-04 | Isolamento de falhas | Cliente lento ou fora do ar não trava a mudança de status de outros pedidos nem causa rollback | `[09:04] Bruno` |
| PRD-NFR-05 | Limite de reenvio | 5 tentativas, em 1m, 5m, 30m, 2h e 12h (⚠️ INF-01) | `[09:17] Larissa` |
| PRD-NFR-06 | Tempo de resposta exigido do cliente | Até 10 segundos; acima disso, conta como falha | `[09:42] Diego` |
| PRD-NFR-07 | Tamanho máximo da notificação | 64KB; acima disso é erro, sem truncar | `[09:23] Sofia`, `[09:24] Larissa` |
| PRD-NFR-08 | Transporte | Somente HTTPS | `[09:23] Sofia` |
| PRD-NFR-09 | Ordem das notificações | Por pedido, enquanto houver um único worker, sem ordem global (⚠️ INF-05) | `[09:13] Larissa` |
| PRD-NFR-10 | Controle de acesso | Reprocessamento só por `ADMIN`; demais operações do CRUD por qualquer usuário autenticado, por enquanto; histórico e troca de secret seguem a mesma regra (⚠️ INF-39) | `[09:36] Larissa`, `[09:37] Sofia` |
| PRD-NFR-11 | Infraestrutura | Nada além do que já existe | `[09:07] Diego`, `[09:30] Larissa` |

## 8. Decisões e trade-offs principais

| ID | Decisão e trade-off | ADR |
|---|---|---|
| PRD-DEC-01 | Status e notificação são registrados juntos, com mais uma escrita na transação de pedido, histórico e estoque, já descrita como pesada (`[09:04] Bruno`) | [ADR-001](./adrs/ADR-001-outbox-no-mysql.md) |
| PRD-DEC-02 | Envio em processo separado com verificação a cada 2 segundos, sem infraestrutura nova, mas com um processo a mais para operar | [ADR-002](./adrs/ADR-002-worker-separado-em-polling.md) |
| PRD-DEC-03 | Reenvio por quase 15 horas e depois reprocessamento manual, com o custo de atrasos longos | [ADR-003](./adrs/ADR-003-retry-com-backoff-e-dlq.md) |
| PRD-DEC-04 | Assinatura com secret por webhook e troca com carência, com verificação a cargo do cliente | [ADR-004](./adrs/ADR-004-assinatura-hmac-com-secret-por-endpoint.md) |
| PRD-DEC-05 | Entrega ao menos uma vez, com deduplicação a cargo do cliente | [ADR-005](./adrs/ADR-005-entrega-at-least-once-com-event-id.md) |
| PRD-DEC-06 | Módulo igual aos demais (`[09:30] Larissa`), aceitando os limites dos padrões atuais, detalhados no ADR | [ADR-006](./adrs/ADR-006-reuso-dos-padroes-existentes.md) |
| PRD-DEC-07 | O evento guarda o estado do momento da mudança, e o filtro de status vale só para mudanças futuras | [ADR-007](./adrs/ADR-007-evento-materializado-na-insercao.md) |
| PRD-DEC-08 | Autenticação existente e cliente informado na requisição, com controle de acesso amplo por enquanto | [ADR-008](./adrs/ADR-008-controle-de-acesso-da-api-de-webhooks.md) |

## 9. Dependências

| ID | Dependência | Responsável citado | Fonte |
|---|---|---|---|
| PRD-DEP-01 | Revisão de segurança de ao menos 2 dias úteis antes do deploy | Sofia | `[09:46] Sofia`, `[09:49] Sofia` |
| PRD-DEP-02 | Confirmação do prazo com a Atlas e atualização dos clientes | Marcos | `[09:47] Marcos`, `[09:49] Marcos` |
| PRD-DEP-03 | Documentação no portal de desenvolvedor | Marcos | `[09:26] Marcos`, `[09:40] Marcos` |
| PRD-DEP-04 | Sessão de revisão do design antes de começar a codar | Larissa, Bruno e Diego | `[09:50] Larissa` |
| PRD-DEP-05 | Deduplicação e verificação de assinatura implementadas por cada cliente | Clientes | `[09:20] Sofia`, `[09:25] Diego` |
| PRD-DEP-06 | Decisões técnicas pendentes (RFC-Q-08, RFC-Q-09, FDD-LAC-03 e FDD-LAC-05) | Não definido | [RFC](./RFC.md), [FDD](./FDD.md) |

## 10. Riscos e mitigação

Probabilidade e impacto não foram estimados na reunião: são avaliação de quem escreve este documento (⚠️ INF-37). A mitigação indica só o que a reunião ou os documentos anteriores definem.

| ID | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| PRD-RISCO-01 | A Atlas migra para um concorrente se o prazo não for cumprido (`[09:00] Marcos`); a duração da sprint não foi citada, então não se sabe se 3 sprints cabem até o fim de novembro | Média | Alto | Marcos confirma o prazo (`[09:47] Marcos`) |
| PRD-RISCO-02 | Sem isolamento entre clientes: um usuário poderia ver ou alterar webhooks de outro cliente (RFC-RISCO-03) | Alta | Alto | Encaminhado à revisão de segurança (⚠️ INF-38); sem mudança definida |
| PRD-RISCO-03 | A restrição do reprocessamento a `ADMIN` pode ser contornada pelo registro público (RFC-RISCO-02) | Alta | Alto | Encaminhado à revisão de segurança (⚠️ INF-38); sem mudança definida |
| PRD-RISCO-04 | Cliente que não deduplica processa a mesma notificação mais de uma vez (`[09:25] Sofia`), por exemplo em um reenvio depois de um timeout de 10 segundos (`[09:42] Diego`) | Média | Médio | Destaque no portal de desenvolvedor (`[09:26] Marcos`) |
| PRD-RISCO-05 | Um cliente sem resposta atrasa as notificações dos demais além dos 10 segundos (RFC-RISCO-01) | Média | Médio | Em aberto: RFC-Q-07 |
| PRD-RISCO-06 | Um cliente com muitas mudanças recebe um grande volume de chamadas (`[09:38] Diego`) | Baixa | Médio | Observar e implementar se virar problema (`[09:39] Diego`) |
| PRD-RISCO-07 | Cliente fora do ar por mais que a janela de reenvio não recebe a notificação e não é avisado, pois o e-mail foi adiado | Baixa | Médio | Reprocessamento manual (`[09:18] Diego`); Marcos considerou aceitável (`[09:17] Marcos`) |

## 11. Critérios de aceitação (visão de produto)

Os critérios técnicos testáveis estão no [FDD, seção 12](./FDD.md).

| ID | Critério | Requisitos |
|---|---|---|
| PRD-CA-01 | Um cliente cadastra um webhook e recebe, em menos de 10 segundos em condições normais, a notificação de um status escolhido (⚠️ INF-43) | PRD-FR-01, PRD-FR-02, PRD-NFR-01 |
| PRD-CA-02 | Um status não escolhido não gera notificação | PRD-FR-07 |
| PRD-CA-03 | O cliente verifica a assinatura e reconhece repetições pelo identificador | PRD-FR-15, PRD-FR-16 |
| PRD-CA-04 | Um cadastro com URL que não usa HTTPS é recusado | PRD-FR-10 |
| PRD-CA-05 | Um cliente fora do ar por duas horas recebe a notificação por reenvio automático quando volta | PRD-FR-11, PRD-NFR-05 |
| PRD-CA-06 | Uma notificação que esgota as tentativas fica registrada e pode ser reprocessada por um administrador, que fica identificado; outros perfis são recusados | PRD-FR-12, PRD-FR-13, PRD-FR-14 |
| PRD-CA-07 | Depois de trocar a secret, o cliente tem 24 horas para migrar sem perder a validação | PRD-FR-09 |
| PRD-CA-08 | O histórico mostra resultado, conteúdo, resposta e tempo de cada entrega | PRD-FR-08 |
| PRD-CA-09 | Um cliente fora do ar não impede nem atrasa a mudança de status | PRD-NFR-04 |
| PRD-CA-10 | O portal de desenvolvedor explica a integração e a possibilidade de repetições | PRD-FR-19 |

## 12. Estratégia de testes e validação

| ID | Etapa | O que valida | Fonte |
|---|---|---|---|
| PRD-TST-01 | Testes automatizados de integração | Critérios técnicos do FDD, com o padrão atual do projeto: Vitest e Supertest contra banco real | `vitest.config.ts`, `tests/setup.ts` |
| PRD-TST-02 | Testes ponta a ponta | Integração com a mudança de status de pedidos | `[09:46] Larissa` |
| PRD-TST-03 | Revisão de segurança | Assinatura e geração de secret; os riscos PRD-RISCO-02 e PRD-RISCO-03 entram por encaminhamento (⚠️ INF-38) | `[09:46] Sofia` |
| PRD-TST-04 | Acompanhamento depois da entrega | Tempo de notificação. O volume por cliente (RFC-Q-01) e o impacto citado por Larissa ainda não têm métrica definida | `[09:37] Larissa`, `[09:39] Diego`, ⚠️ INF-17 |

A reunião não definiu homologação com os clientes solicitantes nem critério de go-live além da revisão de segurança.

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-01.** "5 tentativas" significa 1 envio inicial + 5 reenvios. Apoio: `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa`.

> ⚠️ Inferência (sem fonte direta): **INF-05.** A ordem por pedido só vale sem reenvio: uma notificação em espera pode ser ultrapassada pela seguinte do mesmo pedido. Apoio: `[09:12] Diego`, `[09:13] Larissa`.

> ⚠️ Inferência (sem fonte direta): **INF-10.** A criação do pedido não gera notificação, e o filtro aceita só `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED` e `CANCELLED`. Apoio: `[09:40] Bruno`, `src/modules/orders/order.status.ts`.

> ⚠️ Inferência (sem fonte direta): **INF-17.** O tempo de notificação e os demais acompanhamentos são medidos a partir de eventos de log novos, descritos no FDD, sem dependência nova. A ferramenta de agregação não está definida. Apoio: `[09:29] Bruno`, `src/shared/logger/index.ts`.

> ⚠️ Inferência (sem fonte direta): **INF-37.** As probabilidades e os impactos da seção 10 são avaliação de quem escreve, exigida pelo formato do PRD. Nenhum valor foi dito na reunião. Os riscos de isolamento e de `ADMIN` têm probabilidade alta porque a condição já existe no código (`src/modules/auth/auth.routes.ts`, `prisma/schema.prisma`).

> ⚠️ Inferência (sem fonte direta): **INF-38.** Encaminhar os riscos de controle de acesso à revisão de segurança é uma decisão de quem escreve, não combinada na reunião. O foco citado por Sofia é HMAC e geração de secret. Apoio: `[09:46] Sofia`.

> ⚠️ Inferência (sem fonte direta): **INF-39.** Histórico e troca de secret aceitam qualquer usuário autenticado, por extensão do CRUD. Apoio: `[09:36] Marcos`, `[09:37] Sofia`.

> ⚠️ Inferência (sem fonte direta): **INF-41.** A meta "3 de 3" é derivada do pedido dos três clientes; ninguém a definiu como meta. Apoio: `[09:00] Marcos`.

> ⚠️ Inferência (sem fonte direta): **INF-43.** "Condições normais" significa sem reenvio e sem o cenário de RFC-Q-07. `[09:02] Marcos` não usou essa ressalva.
