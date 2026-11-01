# Notas do processo

Registro das correções reais feitas durante a produção. Base da seção "Iterações e ajustes" do README.

### Iteração 1 — Inventário (Etapa 1) — 2026-10-31
- Problema: na exploração inicial, a IA anunciou que resolveria sozinha ambiguidades da reunião, como adotar "1 envio + 5 reenvios", e que levaria ao RFC temas que ninguém levantou, como SSRF.
- Como detectei: releitura da versão ajustada de `docs/desafio/prompt_docs.md`, que manda listar ambiguidades para decisão humana e aplica a regra R2.
- Ajuste no prompt: nenhum no arquivo; as regras da Etapa 1 e a R2 passaram a valer sobre o plano da IA.
- Resultado: o inventário lista as ambiguidades com recomendação, e os assuntos não tratados na reunião ficam separados como `⚠️ Inferência`.

### Iteração 2 — Inventário (Etapa 1) — 2026-10-31
- Problema: o exemplo `WEBHOOK_ENDPOINT_NOT_FOUND` do prompt difere do `WEBHOOK_NOT_FOUND` citado em `[09:28] Bruno`.
- Como detectei: comparação do prompt com a transcrição.
- Ajuste no prompt: nenhum no arquivo; registrado como ambiguidade 12 do inventário.
- Resultado: recomendação de usar o código da transcrição, pendente de revisão humana.

### Iteração 3 — Inventário (Etapa 1) — 2026-10-31
- Problema: o inventário tinha sido gerado sem exploração independente e em `docs/desafio/`. Faltavam a lista de falantes, a de caminhos confirmados e alguns fatos do código. Uma ambiguidade já apontada ao usuário, a do `X-Timestamp` não assinado, também tinha ficado de fora.
- Como detectei: nova versão de `docs/desafio/prompt_docs.md`, que exige subagentes Explore e plan mode, e comparação dos relatórios dos subagentes com o inventário.
- Ajuste no prompt: o usuário reescreveu o prompt para o Claude Code. A IA passou a seguir a preparação, com `CLAUDE.md`, bloqueio de edição e checksums. Por decisão própria, também incluiu as configurações nos checksums, porque a checklist da Etapa 8 as cobre e o comando do prompt não.
- Resultado: `trabalho/INVENTARIO.md` substitui o arquivo antigo. Nenhum fato foi contradito. Entraram as limitações transversais, a falta de controle de concorrência em `changeStatus` e a ambiguidade 17.

### Iteração 4 — Inventário (Etapa 1) — 2026-10-31
- Problema: 17 ambiguidades e vários assuntos não tratados na reunião impediam escrever os ADRs sem inventar decisões.
- Como detectei: lista de ambiguidades exigida pela Etapa 1.
- Ajuste no prompt: o usuário aceitou as recomendações e pediu inferências para a Etapa 1.
- Resultado: o inventário ganhou 19 inferências com IDs `INF-01` a `INF-19`, marcadas como não decididas na reunião. Os demais itens viraram riscos, definições editoriais ou itens de revisão humana.

### Iteração 5 — ADRs (Etapa 2) — 2026-10-31
- Problema: a primeira versão citava `[09:50] Marcos` e `[09:50] Sofia`, que são registros de saída, não falas, e 14 citações ou caminhos usados no texto faltavam na linha "Fontes" de sete ADRs.
- Como detectei: leitura do ADR-007 para o primeiro caso e script próprio que confere pares `[hh:mm] Nome`, caminhos, links e seções para o segundo.
- Ajuste no prompt: nenhum; correção direta nos ADRs.
- Resultado: citação de saída trocada por referência a `TRANSCRICAO.md` e linhas "Fontes" completadas.

### Iteração 6 — ADRs (Etapa 2) — 2026-10-31
- Problema: a leitura do código para os ADRs revelou pontos que contradizem falas da reunião: o logger não é usado em `src/modules` (`[09:29] Bruno`), `User` não tem vínculo com `Customer` (`[09:32] Marcos`) e `role: ADMIN` é aceito no registro público.
- Como detectei: abertura direta dos arquivos antes de citá-los (R3), incluindo `src/modules/users/user.service.ts`, que confirmou a gravação do `role`.
- Ajuste no prompt: nenhum.
- Resultado: os pontos entraram como limitações e riscos nos ADRs 006 e 008, atribuídos ao código e sem proposta de mudança. Como nenhuma alternativa ao reuso foi debatida, o ADR-006 traz uma alternativa plausível marcada como `INF-20`.

### Iteração 7 — RFC (Etapa 3) — 2026-10-31
- Problema: a primeira versão atribuía à secret global a vantagem "mais simples de gerir", que ninguém citou; juntava duas alternativas descartadas em um único ID; e afirmava que o snapshot "ainda não passou" por Marcos e Sofia, quando a transcrição só mostra que não participaram da decisão.
- Como detectei: releitura do RFC contra a transcrição, depois que o script de citações, caminhos, links e tamanho passou sem apontar nada. O script não detecta afirmação sem fonte.
- Ajuste no prompt: nenhum; correção direta no RFC.
- Resultado: vantagem removida, alternativas separadas em `RFC-ALT-10` e `RFC-ALT-11`, e frase ajustada ao que a transcrição sustenta.

### Iteração 8 — FDD (Etapa 4) — 2026-10-31
- Problema: a primeira versão apresentava "5 reenvios" como valor da reunião, em `FDD-OBJ-04`, quando a reunião disse "5 tentativas", e não registrava que o worker precisa de `JWT_SECRET`, exigido por `src/config/env.ts`.
- Como detectei: releitura do FDD contra a transcrição e o código, depois que o script de seções, citações, caminhos, elementos de código e matriz de erros passou.
- Ajuste no prompt: nenhum; correção direta no FDD.
- Resultado: `FDD-OBJ-04` passou a citar a inferência `INF-01`, e `FDD-INT-16` registra a exigência de `JWT_SECRET`.

### Iteração 9 — FDD (Etapa 4) — 2026-10-31
- Problema: especificar o nível de implementação expôs detalhes que a reunião não definiu. Montar o router de webhooks sem prefixo com `router.use(authenticate)` exigiria token de todas as rotas registradas depois dele, e o replay exige um `id` que nenhum endpoint permite descobrir.
- Como detectei: leitura de `src/routes/index.ts`, `src/modules/orders/order.routes.ts` e `src/modules/users/user.routes.ts` ao desenhar as rotas, e revisão dos contratos.
- Ajuste no prompt: nenhum.
- Resultado: 16 inferências novas (`INF-21` a `INF-36`), sem aceite, e a lacuna `FDD-LAC-03`. Nenhum conflito com ADRs ou RFC foi encontrado, e as lacunas `RFC-Q-08` e `RFC-Q-09` seguem sem especificação.

### Iteração 10 — PRD (Etapa 5) — 2026-10-31
- Problema: `PRD-FORA-07` classificava a ordem global como "descartada", quando a reunião a registrou como limitação conhecida (`[09:13] Larissa`), o que contraria a regra R4. O formato do PRD também exige probabilidade e impacto, que ninguém estimou na reunião.
- Como detectei: releitura do PRD contra a transcrição para o primeiro caso e comparação do formato pedido com o inventário para o segundo. O script só apontou um falso positivo, "polling" no nome de arquivo do ADR-002, e foi ajustado para ignorar links.
- Ajuste no prompt: nenhum; correção direta no PRD.
- Resultado: classificação corrigida, e as avaliações de risco marcadas como `INF-37`, sem atribuição aos participantes.

### Iteração 11 — Tracker (Etapa 6) — 2026-10-31
- Problema: a primeira geração falhou porque `FDD-INT-17` apontava para `src/worker.ts`, arquivo planejado. Na versão seguinte, 82 itens não tinham citação na própria linha, e lacunas como `RFC-Q-08` apontavam para falas sobre o comportamento relacionado, dando a impressão de que a lacuna tinha sido discutida.
- Como detectei: validador do gerador, conferência com um segundo script e leitura de uma amostra das linhas.
- Ajuste no prompt: nenhum. A tabela passou a ser gerada a partir dos documentos, com um mapa manual de fontes para os 82 itens.
- Resultado: caminhos planejados excluídos da localização, 80 itens ligados à fala de origem, 2 listados como sem fonte (`RFC-Q-11`, `FDD-LAC-04`), e a seção de cobertura explica o caso das lacunas. Scripts em `trabalho/scripts/`.

### Iteração 12 — README (Etapa 7) — 2026-10-31
- Problema: a primeira versão citava os registros de saída de 09:50 no formato `[hh:mm] Nome` para explicar um erro antigo, o que repetiria o próprio erro e seria acusado na checagem da Etapa 8.
- Como detectei: script de conferência do README, que também compara os blocos de prompt com os originais.
- Ajuste no prompt: nenhum; correção direta no README.
- Resultado: frase reescrita sem o formato de citação. As etapas 8 e 9 constam como pendentes, e o README precisa ser atualizado depois delas.

### Iteração 13 — Todos os documentos (Etapas 8 e 9) — 2026-10-31
- Problema: a auditoria achou 14 problemas confirmados. Os principais: revisão da Sofia ampliada além de `[09:46] Sofia`, permissão do CRUD estendida a rotação e histórico, secret "só na criação" e meta "3 de 3" sem marca de inferência; métrica de acúmulo que para quando o worker para; exemplo que contradizia a matriz de erros; textos corrompidos e localizações fracas no Tracker; duas repetições entre RFC e FDD.
- Como detectei: subagente sem o histórico da produção. Nenhum deles foi apontado pelos scripts.
- Ajuste no prompt: o prompt da auditoria, além da checklist da Etapa 8, passou a pedir que se verifique se a fala ou o arquivo citado sustenta a afirmação, com amostra do Tracker e busca de contradições entre documentos.
- Resultado: 14 problemas corrigidos, `INF-38` a `INF-42` e a lacuna `FDD-LAC-05` adicionadas, e o gerador do Tracker ajustado. O aceite de `INF-20` a `INF-37` foi registrado. Nove ressalvas discutíveis ficaram sem mudança, à espera de decisão humana.

### Iteração 14 — Todos os documentos (Etapa 9) — 2026-10-31
- Problema: a revisão crítica achou um evento que ficaria preso em `PROCESSING` depois de erro no worker, motivo de DLQ indefinido, truncamento de `response` que podia estourar a coluna, "pior caso" de 100s que não era o pior, transição de replay sem garantia, "em condições normais" atribuído a Marcos, lista de campos fechada sem marca, responsável errado em `RFC-Q-02`, limite "único worker" omitido em `PRD-NFR-09` e detalhes de implementação nos ADRs.
- Como detectei: subagente sem o histórico, com os quatro prompts de revisão crítica da Etapa 9, mais a leitura do FDD como implementador. O prompt foi ajustado para ignorar inferências já declaradas e não repetir a conferência dos scripts.
- Ajuste no prompt: prompts de revisão aplicados como escritos, com o acréscimo acima.
- Resultado: erros confirmados corrigidos, `INF-43` a `INF-45` adicionadas, `FDD-CA-16` e `FDD-RISCO-08` criados, `INF-11`, `INF-14` e `INF-19` detalhadas só no FDD. Nenhum item descartado ou adiado apareceu como requisito. Itens discutíveis e reescritas de genericidade ficaram sem mudança, à espera de decisão humana.

### Iteração 15 — Itens discutíveis (Etapa 9) — 2026-10-31
- Problema: as revisões deixaram itens discutíveis e 12 trechos genéricos, e `INF-38` a `INF-45` aguardavam aceite.
- Como detectei: relatórios dos subagentes das iterações 13 e 14.
- Ajuste no prompt: nenhum. O usuário aceitou as inferências e as recomendações da IA.
- Resultado: `RFC-ALT-07`, "um evento por vez", `docs/adrs/README.md` e a assinatura sobre a string exata foram ajustados, e os 12 trechos foram ancorados em falas ou no código. Duas reescritas sugeridas foram adaptadas, porque levariam detalhe de implementação ao RFC e ao PRD. Cortes mantiveram o RFC no limite de páginas. As demais ressalvas ficaram como estavam.
