import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const text = readFileSync(join(root, 'README.md'), 'utf8');
const prompts = readFileSync(join(root, 'docs', 'desafio', 'prompt_docs.md'), 'utf8');
const claude = readFileSync(join(root, 'CLAUDE.md'), 'utf8');
const normalize = (s) => s.replace(/\r/g, '').replace(/\s+/g, ' ').trim();
let problems = 0;
const report = (m) => { problems++; console.log(m); };

for (const s of ['## Sobre o desafio', '## Ferramentas de IA utilizadas', '## Workflow adotado', '## Prompts customizados', '## Iterações e ajustes', '## Como navegar a entrega']) {
  if (!text.includes(s)) report(`seção ausente: ${s}`);
}

// Links locais existem
for (const m of text.matchAll(/\]\((?!https?:)([^)#]+)\)/g)) if (!existsSync(join(root, m[1]))) report(`link quebrado: ${m[1]}`);

// Citações válidas
const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}
for (const c of new Set(text.match(/\[\d\d:\d\d\] [A-Z][a-zçã]+/g) ?? [])) if (!valid.has(c)) report(`citação inválida: ${c}`);

// Blocos de prompt são literais
const blocks = [...text.matchAll(/```text\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
const sources = normalize(prompts) + ' ' + normalize(claude);
for (const b of blocks) if (!sources.includes(normalize(b))) report(`prompt não literal: ${b.slice(0, 60)}`);

// Contagens citadas conferem
const notes = readFileSync(join(root, 'notas-processo.md'), 'utf8');
const iterations = (notes.match(/^### Iteração/gm) ?? []).length;
if (!text.includes(`${iterations} correções`)) report(`iterações nas notas: ${iterations}`);
const inv = readFileSync(join(root, 'trabalho', 'INVENTARIO.md'), 'utf8');
const infs = new Set(inv.match(/^\| INF-\d\d \|/gm) ?? []).size;
if (!text.includes(`${infs} inferências`)) report(`inferências no inventário: ${infs}`);

console.log(`Blocos de prompt: ${blocks.length} | iterações: ${iterations} | inferências: ${infs}`);
console.log(problems ? `PROBLEMAS: ${problems}` : 'OK: nenhum problema');
