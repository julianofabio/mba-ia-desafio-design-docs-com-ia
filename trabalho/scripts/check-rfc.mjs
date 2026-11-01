import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.argv[2];
const file = join(root, 'docs', 'RFC.md');
const text = readFileSync(file, 'utf8');
const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}
let problems = 0;
const report = (msg) => { problems++; console.log(msg); };

const sections = ['## 1. Metadados', '## 2. Resumo executivo', '## 3. Contexto e problema', '## 4. Proposta técnica', '## 5. Alternativas consideradas', '## 6. Questões em aberto', '## 7. Impacto e riscos', '## 8. Decisões relacionadas'];
for (const s of sections) if (!text.includes(s)) report(`seção ausente: ${s}`);
for (const n of ['Larissa', 'Marcos', 'Bruno', 'Diego', 'Sofia']) if (!text.split('## 2.')[0].includes(n)) report(`revisor ausente: ${n}`);

for (const c of new Set(text.match(/\[\d\d:\d\d\] [A-Z][a-zçã]+/g) ?? [])) if (!valid.has(c)) report(`citação inválida: ${c}`);
for (const raw of new Set(text.match(/(?:src|prisma|tests)\/[\w./-]+/g) ?? [])) {
  const p = raw.replace(/[.\/]+$/, '');
  if (!existsSync(join(root, p))) report(`caminho inexistente: ${p}`);
}
const links = [...text.matchAll(/\]\((\.[^)]+)\)/g)].map((m) => m[1]);
for (const l of new Set(links)) if (!existsSync(join(dirname(file), l))) report(`link quebrado: ${l}`);

// Fronteira com o FDD: valores e detalhes que não deveriam estar no RFC
for (const t of ['WEBHOOK_', 'CREATE TABLE', 'event_type', 'total_cents', '64KB', '1m/5m', 'X-Webhook-Id', 'POST /', 'PATCH /', 'application/json']) {
  if (text.includes(t)) report(`detalhe de implementação: ${t}`);
}

const ids = (re) => new Set(text.match(re) ?? []).size;
const words = text.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
console.log(`palavras: ${words} (~${(words / 500).toFixed(1)} páginas a 500 palavras/página)`);
console.log(`RFC-ALT: ${ids(/RFC-ALT-\d\d/g)} | RFC-Q: ${ids(/RFC-Q-\d\d/g)} | links de ADR distintos: ${new Set(links.filter((l) => l.includes('adrs/'))).size}`);
console.log(problems ? `PROBLEMAS: ${problems}` : 'OK: nenhum problema');
