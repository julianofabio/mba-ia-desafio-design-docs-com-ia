import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.argv[2];
const file = join(root, 'docs', 'PRD.md');
const text = readFileSync(file, 'utf8');
const earlier = ['docs/RFC.md', 'docs/FDD.md'].map((p) => readFileSync(join(root, p), 'utf8')).join('\n');
const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}
let problems = 0;
const report = (msg) => { problems++; console.log(msg); };

const sections = ['## 1. Resumo', '## 2. Problema', '## 3. Público-alvo', '## 4. Objetivos', '## 5. Escopo', '### 5.1 Incluso', '### 5.2 Fora de escopo', '## 6. Requisitos funcionais', '## 7. Requisitos não funcionais', '## 8. Decisões', '## 9. Dependências', '## 10. Riscos', '## 11. Critérios', '## 12. Estratégia'];
for (const s of sections) if (!text.includes(s)) report(`seção ausente: ${s}`);

for (const c of new Set(text.match(/\[\d\d:\d\d\] [A-Z][a-zçã]+/g) ?? [])) if (!valid.has(c)) report(`citação inválida: ${c}`);
for (const raw of new Set(text.match(/(?:src|prisma|tests)\/[\w./-]*\w/g) ?? [])) if (!existsSync(join(root, raw))) report(`caminho inexistente: ${raw}`);
if (!existsSync(join(root, 'vitest.config.ts'))) report('vitest.config.ts inexistente');
for (const l of new Set([...text.matchAll(/\]\((\.[^)#]+)\)/g)].map((m) => m[1]))) if (!existsSync(join(dirname(file), l))) report(`link quebrado: ${l}`);
for (const id of new Set(text.match(/(?:RFC-(?:Q|RISCO)|FDD-LAC)-\d\d/g) ?? [])) if (!earlier.includes(id)) report(`ID inexistente: ${id}`);

// Cada requisito tem fonte na mesma linha
const rows = text.split('\n').filter((l) => /^\| PRD-(FR|NFR)-\d\d/.test(l));
for (const r of rows) if (!/\[\d\d:\d\d\]/.test(r)) report(`requisito sem fonte: ${r.slice(0, 50)}`);

// Requisitos citados nos critérios existem
const defined = new Set(rows.map((r) => r.match(/PRD-(?:FR|NFR)-\d\d/)[0]));
for (const id of new Set(text.match(/PRD-(?:FR|NFR)-\d\d/g) ?? [])) if (!defined.has(id)) report(`requisito não definido: ${id}`);

// Nível de produto: termos de implementação
for (const t of ['WEBHOOK_', 'webhook_outbox', 'webhook_dead_letter', 'publishWebhookEvent', 'changeStatus', 'X-Signature', 'X-Event-Id', 'X-Webhook-Id', 'PrismaClient', 'npm run', '@@', 'CREATE TABLE', 'HMAC-SHA256', 'updateMany', 'polling']) {
  if (text.replace(/\]\(\.[^)]*\)/g, ']').includes(t)) report(`detalhe de implementação: ${t}`);
}

const c = (re) => new Set(text.match(re) ?? []).size;
console.log(`FR: ${c(/PRD-FR-\d\d/g)} | NFR: ${c(/PRD-NFR-\d\d/g)} | Riscos: ${c(/PRD-RISCO-\d\d/g)} | Fora: ${c(/PRD-FORA-\d\d/g)} | CA: ${c(/PRD-CA-\d\d/g)} | palavras: ${text.split(/\s+/).length}`);
console.log(problems ? `PROBLEMAS: ${problems}` : 'OK: nenhum problema');
