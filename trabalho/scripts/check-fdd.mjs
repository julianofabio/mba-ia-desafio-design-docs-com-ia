import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.argv[2];
const file = join(root, 'docs', 'FDD.md');
const text = readFileSync(file, 'utf8');
const rfc = readFileSync(join(root, 'docs', 'RFC.md'), 'utf8');
const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}
let problems = 0;
const report = (msg) => { problems++; console.log(msg); };

const sections = ['## 1. Contexto', '## 2. Objetivos', '## 3. Escopo', '## 4. Fluxos', '### 4.1', '### 4.2', '### 4.3', '### 4.4', '## 5. Modelo', '## 6. Contratos', '## 7. Matriz', '## 8. Estratégias', '## 9. Observabilidade', '## 10. Integração com o sistema existente', '## 11. Dependências', '## 12. Critérios', '## 13. Riscos'];
for (const s of sections) if (!text.includes(s)) report(`seção ausente: ${s}`);

for (const c of new Set(text.match(/\[\d\d:\d\d\] [A-Z][a-zçã]+/g) ?? [])) if (!valid.has(c)) report(`citação inválida: ${c}`);

const planned = ['src/worker.ts', 'src/modules/webhooks', 'tests/webhooks.test.ts', 'prisma/migrations/'];
for (const raw of new Set(text.match(/(?:src|prisma|tests)\/[\w./-]*[\w]/g) ?? [])) {
  if (planned.some((x) => raw.startsWith(x)) || raw.includes('*')) continue;
  if (!existsSync(join(root, raw))) report(`caminho inexistente: ${raw}`);
}
for (const f of ['package.json', 'docker-compose.yml', 'tsconfig.build.json']) if (text.includes(f) && !existsSync(join(root, f))) report(`inexistente: ${f}`);
for (const m of new Set([...text.matchAll(/\]\((\.[^)]+)\)/g)].map((x) => x[1]))) if (!existsSync(join(dirname(file), m))) report(`link quebrado: ${m}`);

// Elementos de código citados existem no código?
const src = ['src/modules/orders/order.service.ts', 'src/routes/index.ts', 'src/app.ts', 'src/shared/errors/http-errors.ts', 'src/shared/logger/index.ts', 'src/middlewares/auth.middleware.ts', 'src/middlewares/validate.middleware.ts', 'src/middlewares/error.middleware.ts', 'src/config/database.ts', 'src/config/env.ts', 'src/server.ts', 'src/shared/http/response.ts', 'src/modules/orders/order.schemas.ts'].map((p) => readFileSync(join(root, p), 'utf8')).join('\n');
for (const e of ['changeStatus', 'buildApiRouter', 'buildControllers', 'Controllers', 'redactPaths', 'requireRole', 'authenticate', 'validate', 'errorMiddleware', 'paginated', 'listOrdersQuerySchema', 'bootstrap', 'InsufficientStockError', 'BadRequestError', 'ConflictError', 'orderStatusHistory']) {
  if (!src.includes(e)) report(`elemento não encontrado no código: ${e}`);
}

// IDs de RFC referenciados existem
for (const id of new Set(text.match(/RFC-(?:Q|RISCO|FORA)-\d\d/g) ?? [])) if (!rfc.includes(id)) report(`ID de RFC inexistente: ${id}`);

// Matriz só com WEBHOOK_*
const matrix = text.split('## 7. Matriz')[1].split('## 8.')[0];
const rows = matrix.split('\n').filter((l) => l.startsWith('| FDD-ERR-'));
for (const r of rows) if (!/^\| FDD-ERR-\d\d \| `WEBHOOK_/.test(r)) report(`linha fora do padrão: ${r.slice(0, 60)}`);

// Inferências marcadas no corpo têm definição conhecida
const inv = readFileSync(join(root, 'trabalho', 'INVENTARIO.md'), 'utf8');
const used = new Set(text.match(/INF-\d\d/g) ?? []);
for (const i of used) if (!text.includes(`**${i}.**`) && !text.split('### Já registradas')[1].includes(i)) report(`inferência sem definição: ${i}`);
for (const i of used) if (!inv.includes(`| ${i} |`)) console.log(`(ainda fora do inventário: ${i})`);

const count = (re) => new Set(text.match(re) ?? []).size;
console.log(`Contratos: ${count(/FDD-CONTRATO-\d\d/g)} | Erros: ${rows.length} | INT: ${count(/FDD-INT-\d\d/g)} | CA: ${count(/FDD-CA-\d\d/g)} | Fluxos: ${count(/FDD-FLUXO-\d\d/g)} | Inferências citadas: ${used.size}`);
console.log(problems ? `PROBLEMAS: ${problems}` : 'OK: nenhum problema');
