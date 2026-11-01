import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.argv[2];
const dir = join(root, 'docs', 'adrs');
const lines = readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/);
const valid = new Set();
for (const l of lines) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}
const required = ['- **Status:**', '- **Data:**', '- **Decisores:**', '- **Fontes:**', '## Contexto', '## Decisão', '## Alternativas Consideradas', '## Consequências', '### Positivas', '### Negativas', '### Trade-off explícito', '## Referências'];
const planned = ['src/worker.ts', 'src/modules/webhooks'];
let problems = 0;
const report = (f, msg) => { problems++; console.log(`${f}: ${msg}`); };

const files = readdirSync(dir).filter((f) => /^ADR-\d{3}-[a-z0-9-]+\.md$/.test(f)).sort();
console.log(`ADRs: ${files.length}`);
for (const f of files) {
  const text = readFileSync(join(dir, f), 'utf8');
  for (const s of required) if (!text.includes(s)) report(f, `seção ausente: ${s}`);

  const cited = new Set(text.match(/\[\d\d:\d\d\] [A-Z][a-zçã]+/g) ?? []);
  for (const c of cited) if (!valid.has(c)) report(f, `citação inválida: ${c}`);

  const fontesLine = text.split(/\r?\n/).find((l) => l.startsWith('- **Fontes:**')) ?? '';
  for (const c of cited) if (!fontesLine.includes(c)) report(f, `fora de Fontes: ${c}`);

  const paths = new Set(text.match(/(?:src|prisma|tests)\/[\w./-]+|package\.json/g) ?? []);
  for (const raw of paths) {
    const p = raw.replace(/[.\/]+$/, '');
    if (planned.some((x) => p.startsWith(x))) continue;
    if (!existsSync(join(root, p))) report(f, `caminho inexistente: ${p}`);
    else if (!fontesLine.includes(p)) report(f, `caminho fora de Fontes: ${p}`);
  }

  for (const m of text.matchAll(/\]\((\.[^)]+)\)/g)) {
    if (!existsSync(join(dirname(join(dir, f)), m[1]))) report(f, `link quebrado: ${m[1]}`);
  }

  const ids = text.match(/\*\*ADR-\d{3}-D-\d{2}|\| ADR-\d{3}-(?:D|ALT)-\d{2}/g) ?? [];
  console.log(`  ${f}: ${cited.size} citações, ${ids.length} IDs, ${(text.match(/⚠️ Inferência/g) ?? []).length} inferências`);
}
console.log(problems ? `PROBLEMAS: ${problems}` : 'OK: nenhum problema');
