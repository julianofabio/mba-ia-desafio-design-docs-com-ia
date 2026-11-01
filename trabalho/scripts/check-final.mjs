import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.argv[2];
const adrs = readdirSync(join(root, 'docs', 'adrs')).filter((f) => f.startsWith('ADR-')).map((f) => `docs/adrs/${f}`);
const docs = ['README.md', 'docs/PRD.md', 'docs/RFC.md', 'docs/FDD.md', 'docs/TRACKER.md', ...adrs];
const texts = Object.fromEntries(docs.map((d) => [d, readFileSync(join(root, d), 'utf8')]));

const valid = new Set();
for (const l of readFileSync(join(root, 'TRANSCRICAO.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\[(\d\d:\d\d)\] ([^:*]+):/);
  if (m) valid.add(`[${m[1]}] ${m[2]}`);
}

// Caminhos planejados: o próprio FDD os declara como novos
const planned = /^(src\/worker\.ts|src\/modules\/webhooks|tests\/webhooks\.test\.ts|prisma\/migrations\/$)/;
const paths = new Set();
const plannedSeen = new Set();
const missing = [];
for (const d of docs) {
  for (const raw of texts[d].match(/(?:src|prisma|tests)\/[\w./-]*\w\/?/g) ?? []) {
    if (planned.test(raw)) { plannedSeen.add(raw); continue; }
    paths.add(raw);
    if (!existsSync(join(root, raw))) missing.push(`${d}: ${raw}`);
  }
}
console.log(`Caminhos citados: ${paths.size} existentes verificados | planejados (novos): ${plannedSeen.size}`);
console.log(`Planejados: ${[...plannedSeen].sort().join(', ')}`);
console.log(`Inexistentes: ${missing.length ? `\n  ${missing.join('\n  ')}` : 'nenhum'}`);

const cited = new Set();
const invalid = [];
for (const d of docs) {
  for (const c of texts[d].match(/\[\d\d:\d\d\] [A-ZÀ-Ú][a-zà-ú]+/g) ?? []) {
    cited.add(c);
    if (!valid.has(c)) invalid.push(`${d}: ${c}`);
  }
}
console.log(`Pares [hh:mm] Nome distintos: ${cited.size} | pares na transcrição: ${valid.size}`);
console.log(`Inválidos: ${invalid.length ? `\n  ${invalid.join('\n  ')}` : 'nenhum'}`);

let links = 0;
const broken = [];
for (const d of docs) {
  for (const m of texts[d].matchAll(/\]\((?!https?:)([^)#\s]+)(?:#[^)]*)?\)/g)) {
    links++;
    if (!existsSync(join(root, dirname(d), m[1]))) broken.push(`${d}: ${m[1]}`);
  }
}
console.log(`Links relativos: ${links} | quebrados: ${broken.length ? `\n  ${broken.join('\n  ')}` : 'nenhum'}`);
