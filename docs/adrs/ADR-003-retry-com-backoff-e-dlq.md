# ADR-003: Retry com backoff exponencial e DLQ em tabela separada

- **Status:** Aceito
- **Data:** 2026-10-31 (data de elaboração; `TRANSCRICAO.md` registra a reunião apenas como "quinta-feira, 09:00")
- **Decisores:** Larissa, Diego; Bruno e Marcos participaram da discussão (`[09:16] Bruno`, `[09:17] Marcos`)
- **Fontes:** `[09:08] Diego`, `[09:09] Diego`, `[09:14] Larissa`, `[09:15] Diego`, `[09:15] Bruno`, `[09:16] Bruno`, `[09:16] Diego`, `[09:16] Larissa`, `[09:17] Diego`, `[09:17] Marcos`, `[09:17] Larissa`, `[09:18] Diego`, `[09:18] Bruno`, `[09:19] Larissa`, `[09:23] Sofia`, `[09:24] Larissa`, `[09:25] Diego`, `[09:35] Diego`, `[09:37] Marcos`, `[09:37] Larissa`, `[09:40] Bruno`, `[09:42] Diego`, `[09:48] Larissa`

## Contexto

O endpoint de um cliente pode ficar fora do ar. Diego lembrou de um cliente que já teve duas horas de indisponibilidade em manutenção planejada (`[09:16] Diego`). A política de reenvio precisa cobrir janelas assim sem deixar eventos pendurados para sempre (`[09:15] Diego`).

## Decisão

- **ADR-003-D-01:** o reenvio usa backoff exponencial nos intervalos 1m, 5m, 30m, 2h e 12h (`[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa`).
- **ADR-003-D-02:** o teto é de 5 tentativas (`[09:15] Diego`, `[09:16] Larissa`, `[09:17] Larissa`, `[09:48] Larissa`). Diego estimou a janela em "quase 15 horas" entre a primeira falha e a última tentativa (`[09:17] Diego`); a soma dos intervalos dá 14h36.
- **ADR-003-D-03:** um cliente que não responde em 10 segundos conta como falha e vai para retry (`[09:42] Diego`).
- **ADR-003-D-04:** esgotadas as tentativas, a falha é permanente e o evento vai para a tabela separada `webhook_dead_letter`, com o payload, o motivo da falha e o timestamp (`[09:15] Diego`, `[09:18] Diego`, `[09:48] Larissa`).
- **ADR-003-D-05:** o reprocessamento é manual, por `POST /admin/webhooks/dead-letter/:id/replay`, que recoloca o evento na outbox como pendente (`[09:18] Diego`, `[09:19] Larissa`, `[09:35] Diego`). A autorização desse endpoint está no ADR-008.

## Alternativas Consideradas

| ID | Alternativa | Prós | Contras | Motivo da rejeição | Fonte |
|---|---|---|---|---|---|
| ADR-003-ALT-01 | Retry indefinido com backoff | "Algumas pessoas defendem", sem vantagem detalhada | Evento fica pendurado para sempre se o cliente sumiu | Falta de um limite | `[09:15] Diego` |
| ADR-003-ALT-02 | 3 tentativas | "Mais agressivo" | Mataria o evento em cerca de 30 minutos, sem cobrir uma manutenção de 2 horas | "3 é pouco" | `[09:16] Bruno`, `[09:16] Diego` |
| ADR-003-ALT-03 | Marcar `failed` na própria outbox, sem tabela separada | Nenhum citado | Leitura menos limpa da outbox; perde a evidência separada | Tabela separada serve de evidência para debug e reprocessamento | `[09:17] Larissa`, `[09:18] Diego` |

## Consequências

### Positivas

- A janela de reenvio cobre indisponibilidades como a manutenção de duas horas citada (`[09:16] Diego`).
- Nenhum evento fica pendurado indefinidamente (`[09:15] Diego`).
- A DLQ preserva a evidência para debug e reprocessamento (`[09:18] Diego`).

### Negativas

- Um evento pode chegar horas depois da mudança de status. Marcos aceitou esse limite: "se um cliente meu cair por 15 horas, ele já tá com problema sério dele" (`[09:17] Marcos`).
- Depois da janela, a recuperação depende de ação manual (`[09:18] Diego`).
- O cliente não é avisado de que o webhook está falhando: o e-mail ficou para uma próxima fase (`[09:37] Marcos`, `[09:37] Larissa`).
- **Lacuna:** a reunião não definiu o que acontece com a linha de `webhook_dead_letter` depois do replay. O ponto fica na lista de revisão humana abaixo.

### Trade-off explícito

Aceitamos que um evento possa atrasar quase 15 horas, ou depender de replay manual, em troca de cobrir manutenções como a de 2 horas (`[09:16] Diego`) e um cliente fora do ar por até 15 horas, que Marcos aceitou como problema do cliente (`[09:17] Marcos`), sem o evento "pendurado" do retry indefinido.

## Referências

- [ADR-001: Outbox no MySQL](./ADR-001-outbox-no-mysql.md)
- [ADR-002: Worker separado em polling](./ADR-002-worker-separado-em-polling.md)
- [ADR-005: Entrega at-least-once](./ADR-005-entrega-at-least-once-com-event-id.md)
- [ADR-008: Controle de acesso da API de webhooks](./ADR-008-controle-de-acesso-da-api-de-webhooks.md)

## Inferências para revisão humana

> ⚠️ Inferência (sem fonte direta): **INF-01.** "5 tentativas" significa 1 envio inicial + 5 reenvios (6 chamadas HTTP), porque são 5 intervalos e a janela citada é contada "entre primeira falha e última tentativa". Apoio: `[09:17] Diego`, `[09:17] Larissa`, `[09:48] Larissa`.

> ⚠️ Inferência (sem fonte direta): **INF-02.** O limite de 64KB, definido como erro caso seja ultrapassado (`[09:23] Sofia`, `[09:24] Larissa`), é checado no worker, antes do envio. Acima dele, o evento não é enviado e vai direto para a DLQ com o motivo. Na inserção, o erro causaria rollback da mudança de status (`[09:40] Bruno`).

> ⚠️ Inferência (sem fonte direta): **INF-06.** `pendente` inclui quem aguarda retry; `falhou` marca a linha esgotada, já copiada para `webhook_dead_letter`; o replay a devolve a `pendente`. Isso concilia o status `falhou`, citado em `[09:08] Diego`, com a tabela separada decidida depois, em `[09:18] Diego`.

> ⚠️ Inferência (sem fonte direta): **INF-12.** O replay mantém o `event_id` e reinicia as tentativas. Apoio: `[09:18] Diego`, `[09:25] Diego`.

> ⚠️ Inferência (sem fonte direta): **INF-13.** Entrega bem-sucedida é resposta 2xx. Qualquer outro status, erro de rede ou timeout conta como falha. Apoio: `[09:42] Diego`.

> ⚠️ Inferência (sem fonte direta): **INF-14.** O reenvio exige controle de tentativas e de agendamento, detalhado no FDD. Apoio: `[09:09] Diego`, `[09:17] Larissa`.

**Lacuna sem inferência adotada:** destino da linha de `webhook_dead_letter` depois do replay.
